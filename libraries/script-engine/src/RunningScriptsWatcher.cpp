//
//  RunningScriptsWatcher.cpp
//  libraries/script-engine/src
//
//  Created by Mohammed Nafees on 05/30/2014.
//  Copyright 2014 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

#include <QStringList>
#include <QMutex>
#include <QDir>
#include <QDebug>

#include "RunningScriptsWatcher.h"

// Returns upper limit of file handles that can be opened by this process at
// once. (which is limited on MacOS, exceeding it will probably result in
// crashes).
static inline quint64 getFileLimit() {
#ifdef Q_OS_MAC
    struct rlimit rl;
    getrlimit(RLIMIT_NOFILE, &rl);
    return rl.rlim_cur; // quint64
#else
    return 0xFFFFFFFF;
#endif
}

// Check if watch should trigger on signal.
bool WatchEntry::trigger(const QString& fileName) {
    // Modified changed?
    const QFileInfo fi(fileName);
    const QDateTime newModifiedTime = fi.exists() ? fi.lastModified() : QDateTime();
    if (newModifiedTime != modifiedTime) {
        modifiedTime = newModifiedTime;
        return true;
    }
    return false;
}

RunningScriptsWatcher* RunningScriptsWatcher::_instance = NULL;

RunningScriptsWatcher* RunningScriptsWatcher::getInstance() {
    static QMutex instanceMutex;

    // lock the instance mutex to make sure we don't race and create two menus and crash
    instanceMutex.lock();

    if (!_instance) {
        qDebug("First call to RunningScriptsWatcher::getInstance().");

        _instance = new RunningScriptsWatcher;
    }

    instanceMutex.unlock();

    return _instance;
}

RunningScriptsWatcher::RunningScriptsWatcher() {
    init();
}

bool RunningScriptsWatcher::watchesFile(const QString &file) const {
    return _files.contains(file);
}

void RunningScriptsWatcher::addFile(const QString &file) {
    addFiles(QStringList(file));
}

void RunningScriptsWatcher::addFiles(const QStringList &files) {
    foreach (const QString &file, files) {
        if (watchesFile(file)) {
            qWarning("RunningScriptsWatcher: File %s is already being watched", qPrintable(file));
            continue;
        }

        if (!checkLimit()) {
            qWarning("File %s is not watched: Too many file handles are already open (max is %u).",
                     qPrintable(file), unsigned(getFileLimit()));
            break;
        }

        _files.insert(file, WatchEntry(file));
        _watcher->addPath(QFileInfo(file).absoluteDir().path());
        _watcher->addPath(file);
    }
}

void RunningScriptsWatcher::removeFile(const QString &file) {
    removeFiles(QStringList(file));
}

void RunningScriptsWatcher::removeFiles(const QStringList &files) {
    foreach (const QString &file, files) {
        WatchEntryHash::iterator it = _files.find(file);
        if (it == _files.end()) {
            qWarning("RunningScriptsWatcher: File %s is not watched.", qPrintable(file));
            continue;
        }
        _files.erase(it);
        _watcher->removePath(file);
    }
}

QStringList RunningScriptsWatcher::files() const {
    return _files.keys();
}

void RunningScriptsWatcher::onDirectoryChanged(const QString &path) {
    QDir dir(path);
    QStringList files = dir.entryList(QStringList() << "*.js", QDir::Files);
    foreach (QString file, files) {
        QString fullFilePath = QDir::toNativeSeparators(path + "/" + file);
        const WatchEntryHash::iterator it = _files.find(fullFilePath);
        if (it != _files.end() && it.value().trigger(fullFilePath)) {
            emit fileChanged(fullFilePath);
        }
    }
}

void RunningScriptsWatcher::init() {
    _watcher = new QFileSystemWatcher;
    connect(_watcher, SIGNAL(directoryChanged(QString)), SLOT(onDirectoryChanged(QString)));
}

bool RunningScriptsWatcher::checkLimit() const {
    return quint64(_files.size()) < (getFileLimit() / 2);
}

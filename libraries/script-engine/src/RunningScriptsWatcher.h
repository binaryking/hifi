//
//  RunningScriptsWatcher.h
//  libraries/script-engine/src
//
//  Created by Mohammed Nafees on 05/30/2014.
//  Copyright 2014 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

#ifndef hifi_RunningScriptsWatcher_h
#define hifi_RunningScriptsWatcher_h

#include <QObject>
#include <QHash>
#include <QDateTime>
#include <QFileInfo>
#include <QFileSystemWatcher>

class WatchEntry
{
public:
    explicit WatchEntry(const QString& file) :
        modifiedTime(QFileInfo(file).lastModified()) {}

    bool trigger(const QString& fileName);

    QDateTime modifiedTime;
};

typedef QHash<QString, WatchEntry> WatchEntryHash;

class RunningScriptsWatcher : public QObject {
    Q_OBJECT
public:
    static RunningScriptsWatcher* getInstance();

    void addFile(const QString& path);
    void addFiles(const QStringList& paths);

    void removeFile(const QString& path);
    void removeFiles(const QStringList& paths);

    bool watchesFile(const QString& file) const;
    QStringList files() const;

private slots:
    void onDirectoryChanged(const QString& path);

signals:
    void fileChanged(const QString& path);

private:
    static RunningScriptsWatcher* _instance;
    QFileSystemWatcher* _watcher;
    WatchEntryHash _files;

    RunningScriptsWatcher();
    void init();
    bool checkLimit() const;
};

#endif // hifi_RunningScriptsWatcher_h

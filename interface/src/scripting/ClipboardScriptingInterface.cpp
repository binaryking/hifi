//
//  ClipboardScriptingInterface.cpp
//  interface/src/scripting
//
//  Copyright 2014 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

#include "Application.h"
#include "ClipboardScriptingInterface.h"

ClipboardScriptingInterface::ClipboardScriptingInterface() {
}

glm::vec3 ClipboardScriptingInterface::getContentsDimensions() {
    return qApp->getEntityClipboard()->getContentsDimensions();
}

float ClipboardScriptingInterface::getClipboardContentsLargestDimension() {
    return qApp->getEntityClipboard()->getContentsLargestDimension();
}

QString ClipboardScriptingInterface::hash(const QString& json) {
    return QCryptographicHash::hash(json.toUtf8(), QCryptographicHash::Sha256).toHex();
}

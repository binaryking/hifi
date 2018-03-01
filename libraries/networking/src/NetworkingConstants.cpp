//
//  NetworkingConstants.cpp
//  libraries/networking/src
//
//  Created by Seth Alves on 2018-2-28.
//  Copyright 2018 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

#include <QDebug>


#include "NetworkingConstants.h"

namespace NetworkingConstants {
    QUrl METAVERSE_SERVER_URL_STABLE() {
        return QUrl("https://metaverse.highfidelity.com");
    }

    QUrl METAVERSE_SERVER_URL_STAGING() {
        return QUrl("https://staging.highfidelity.com");
    }

    // You can change the return of this function if you want to use a custom metaverse URL at compile time
    // or you can pass a custom URL via the env variable
    QUrl METAVERSE_SERVER_URL() {
        static const QString HIFI_METAVERSE_URL_ENV = "HIFI_METAVERSE_URL";
        static const QUrl serverURL = QProcessEnvironment::systemEnvironment().contains(HIFI_METAVERSE_URL_ENV)
            ? QUrl(QProcessEnvironment::systemEnvironment().value(HIFI_METAVERSE_URL_ENV))
            : METAVERSE_SERVER_URL_STABLE();
        return serverURL;
    };
}

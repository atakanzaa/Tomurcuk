package com.tomurcuk;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/** Modüller arası olay dinleyicileri (@ApplicationModuleListener) ayrı iş parçacığında çalışır. */
@Configuration(proxyBeanMethods = false)
@EnableAsync
class AsyncConfig {
}

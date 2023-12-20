package com.demo.virtual.thread;

import java.util.concurrent.Executors;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class ThreadPoolExecutor extends AbstractExecutor {

    public ThreadPoolExecutor (int poolSize) {
        super(Executors.newFixedThreadPool(poolSize, Thread.ofPlatform().name("platform-", 0).factory()));
    }

}

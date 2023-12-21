package com.demo.virtual.thread;

import java.util.concurrent.Executors;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class VirtualThreadPoolExecutor extends AbstractExecutor {

    public VirtualThreadPoolExecutor () {
        super(Executors.newThreadPerTaskExecutor(Thread.ofVirtual().name("virtual-").factory()));
    }

}

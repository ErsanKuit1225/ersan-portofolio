package com.demo.virtual.thread;

import java.util.LinkedList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public abstract class AbstractExecutor implements AutoCloseable {
    private final ExecutorService pool;
    private final List<Future<?>> futures;
    private long start;

    protected AbstractExecutor (ExecutorService pool) {
        this.pool = pool;
        this.futures = new LinkedList<>();
    }

    public void submit (Callable<?> task) {
        if (futures.isEmpty()) {
            start = System.currentTimeMillis();
        }
        this.pool.submit(task);
    }

    @Override
    public void close () throws Exception {
        log.info("[{}] Start to closed", this.getClass().getSimpleName());
        this.pool.close();
        for (var f : futures) {
            f.get();
        }
        log.info("[{}] All task done in [{}] ms", this.getClass().getSimpleName(), System.currentTimeMillis() - start);
    }
}

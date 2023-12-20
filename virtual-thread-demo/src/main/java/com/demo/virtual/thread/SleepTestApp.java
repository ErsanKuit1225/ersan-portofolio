package com.demo.virtual.thread;

import java.time.Duration;
import java.util.stream.IntStream;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class SleepTestApp {

    public static void main (String[] args) throws Exception {
        var numberTask = 10;
        var sleepSecond = 2;
        executeTest(new ThreadPoolExecutor(5), numberTask, sleepSecond);
        executeTest(new VirtualThreadPoolExecutor(), numberTask, sleepSecond);
    }

    private static void executeTest (AbstractExecutor executor, int numberTask, int sleepSecond) throws Exception {
        try (executor) {
            IntStream.range(0, numberTask).forEach(i ->
                executor.submit(() -> {
                    try {
                        log.debug("[{}] Start task [{}]", executor.getClass().getSimpleName(), i);
                        Thread.sleep(Duration.ofSeconds(sleepSecond));
                        log.debug("[{}] End task [{}]", executor.getClass().getSimpleName(), i);
                        return i;
                    }
                    catch (InterruptedException e) {
                        throw new RuntimeException(e);
                    }
                })
            );
        }
    }
}

package com.example.switchpatternmatchingjava21.Shape;

public class Square implements Shape {
    private double site;

    public Square(double site) {
        this.site = site;
    }

    @Override
    public double area() {
        return site * site;
    }

}

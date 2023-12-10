package com.example.switchpatternmatchingjava21.SealedShape;

public final class Rectangle implements Shape {
    private double width;

    private double length;

    public Rectangle(double width, double length) {
        this.width = width;
        this.length = length;
    }

    @Override
    public double area() {
        return width * length;
    }

}

package com.example.switchpatternmatchingjava21.Shape;

public class Circle implements Shape {
    private double radius;


    public Circle(double radius) {
        this.radius = radius;
    }

    @Override
    public double area() {
        return radius * radius * 3.14;
    }

}

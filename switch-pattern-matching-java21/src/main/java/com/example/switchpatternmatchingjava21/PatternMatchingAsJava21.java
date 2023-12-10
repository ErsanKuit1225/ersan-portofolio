package com.example.switchpatternmatchingjava21;

import com.example.switchpatternmatchingjava21.Shape.Circle;
import com.example.switchpatternmatchingjava21.Shape.Shape;
import com.example.switchpatternmatchingjava21.Shape.Square;

import java.awt.*;

public class PatternMatchingAsJava21 {
    public static void main(String[] args) {
        System.out.println(areaCalculate(new Square(5)));
        System.out.println(areaCalculateGuardCondition(new Circle(1000)));
        System.out.println(areaCalculateNullHandler(null));
    }

    // As of Java 21
    static double areaCalculate(Shape shape) {
        return switch (shape) {
            case Square s -> s.area();
            case Circle c -> c.area();
            default -> 0.0;
        };
    }

    static String areaCalculateGuardCondition(Shape shape) {
        String message =  switch (shape) {
            case Circle c when c.area() > 100 -> "A Large Circle with area of "+ c.area();
            case Circle c -> "A Circle with area of " + c.area();
            case Square s -> "A Square with area of " + s.area();
            default ->  "unknown shape";
        };

        return message;
    }

    static String areaCalculateNullHandler(Shape shape) {
//        if(shape == null){
//            return "Thare are no shape to calculate";
//        }
        String message =  switch (shape) {
            case null -> "Thare are no shape to calculate";
            case Circle c -> "A Circle with area of " + c.area();
            case Square s -> "A Square with area of " + s.area();
            default ->  "unknown shape";
        };
        return message;
    }

//    static String areaCalculateCaseDominance(Shape shape) {
//        return switch (shape) {
//            case Circle c -> "A Circle with area of " + c.area();
//            case Circle c when c.area() > 100   //Compile error
//                    -> "A Large Circle with area of "+ c.area();
//            case Square s -> "A Square with area of " + s.area();
//            default ->  "unknown shape";
//        };
//    }
//
//    static String areaCalculateCaseDominancev2(Shape shape) {
//        return switch (shape) {
//            case Shape s -> "unknown shape" + s.area();
//            case Circle c -> "A Circle with area of " + c.area();
//            case Square s -> "A Square with area of " + s.area();
//            default ->  "unknown shape";
//        };
//    }
}

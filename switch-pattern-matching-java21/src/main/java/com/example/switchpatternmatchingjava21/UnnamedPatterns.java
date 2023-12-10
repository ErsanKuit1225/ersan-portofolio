package com.example.switchpatternmatchingjava21;

import com.example.switchpatternmatchingjava21.SealedShape.Circle;
import com.example.switchpatternmatchingjava21.SealedShape.Rectangle;
import com.example.switchpatternmatchingjava21.SealedShape.Shape;
import com.example.switchpatternmatchingjava21.SealedShape.Square;

public class UnnamedPatterns {
    public static void main(String[] args) {
        System.out.println(unnamedPatterns(new Square(10)));
    }

    static String java21(Shape shape) {
        return switch (shape) {
            case Circle c -> "A Circle with area of " + c.area();
            case Square s -> "we don't want to calculate area of this shape";
            case Rectangle r -> "we don't want to calculate area of this shape";
        };
    }

    static String unnamedPatterns(Shape shape) {
        return switch (shape) {
            case Circle c -> "A Circle with area of " + c.area();
            case Square _ -> "we don't want to calculate area of this shape";
            case Rectangle _ -> "we don't want to calculate area of this shape";
        };
    }

    static String unnamedPatternsV2(Shape shape) {
        return switch (shape) {
            case Circle c -> "A Circle with area of " + c.area();
            case Square _, Rectangle _ -> "we don't want to calculate area of this shape";
        };
    }
}

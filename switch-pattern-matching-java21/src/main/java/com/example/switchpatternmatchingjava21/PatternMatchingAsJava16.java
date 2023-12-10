package com.example.switchpatternmatchingjava21;

import com.example.switchpatternmatchingjava21.Shape.Circle;
import com.example.switchpatternmatchingjava21.Shape.Shape;
import com.example.switchpatternmatchingjava21.Shape.Square;

public class PatternMatchingAsJava16 {
    public static void main(String[] args) {
        System.out.println(areaCalculate(new Circle(5)));
    }

    // Prior to Java 21
    static double areaCalculate(Shape shape) {
        if (shape instanceof Circle c) {
            return  c.area();
        } else if (shape instanceof Square s) {
            return s.area();
        }
        return 0.0;
    }
}

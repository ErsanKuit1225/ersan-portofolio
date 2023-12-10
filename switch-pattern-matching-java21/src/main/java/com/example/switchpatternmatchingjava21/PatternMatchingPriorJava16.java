package com.example.switchpatternmatchingjava21;

import com.example.switchpatternmatchingjava21.Shape.Circle;
import com.example.switchpatternmatchingjava21.Shape.Shape;
import com.example.switchpatternmatchingjava21.Shape.Square;

public class PatternMatchingPriorJava16 {

    public static void main(String[] args) {
        System.out.println(areaCalculate(new Square(5)));
    }

    // Prior to Java 21
    static double areaCalculate(Shape shape) {
        if (shape instanceof Circle) {
            Circle c = (Circle) shape;

            return  c.area();
        } else if (shape instanceof Square) {
            Square s = (Square) shape;

            return s.area();
        }
        return 0.0;
    }
}

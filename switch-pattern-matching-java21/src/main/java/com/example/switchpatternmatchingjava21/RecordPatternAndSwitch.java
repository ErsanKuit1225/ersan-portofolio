package com.example.switchpatternmatchingjava21;

import com.example.switchpatternmatchingjava21.SealedShape.Circle;
import com.example.switchpatternmatchingjava21.SealedShape.Rectangle;
import com.example.switchpatternmatchingjava21.SealedShape.Shape;
import com.example.switchpatternmatchingjava21.SealedShape.Square;

public class RecordPatternAndSwitch {

    public static void main(String[] args) {
        record Pair(Object x, Object y) { }

        Pair p = new Pair(42, 42);

        switch (p) {
            case Pair(String s, String t) -> System.out.println(s + ", " + t);
            default -> System.out.println("Not a pair of strings");
        }

    }


}

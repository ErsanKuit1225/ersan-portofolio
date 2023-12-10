package com.example.switchpatternmatchingjava21.SealedShape;

public sealed interface Shape permits Circle, Square, Rectangle{
    double area();
}


import { Canvas, Fill, ImageShader, Shader, Skia, useImage } from '@shopify/react-native-skia';
import React from 'react';
import { View } from 'react-native';

/**
 * Foto em pontilhado 1-bit (ordered dithering, matriz de Bayer 8×8):
 * vira só tinta e papel, o visual de jornal dos stories.
 */
const effect = Skia.RuntimeEffect.Make(`
uniform shader image;
uniform float cell;
uniform float3 ink;
uniform float3 paper;

float bayer2(float2 a) { a = floor(a); return fract(dot(a, float2(0.5, a.y * 0.75))); }
float bayer4(float2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(float2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

half4 main(float2 xy) {
  float2 p = floor(xy / cell) * cell + cell * 0.5;
  half4 c = image.eval(p);
  float l = dot(float3(c.rgb), float3(0.299, 0.587, 0.114));
  l = clamp((l - 0.5) * 1.35 + 0.55, 0.0, 1.0);
  float3 col = l > bayer8(xy / cell) ? paper : ink;
  return half4(half3(col), 1.0);
}
`);

const INK = [0.078, 0.078, 0.075];
const PAPER = [0.949, 0.937, 0.902];

export function DitherImage({ uri, width, height, cell = 2 }: { uri: string; width: number; height: number; cell?: number }) {
  const image = useImage(uri);
  if (!image || !effect || !width || !height) {
    return <View style={{ width, height, backgroundColor: '#D8D3C5' }} />;
  }
  return (
    <Canvas style={{ width, height }}>
      <Fill>
        <Shader source={effect} uniforms={{ cell, ink: INK, paper: PAPER }}>
          <ImageShader image={image} fit="cover" rect={{ x: 0, y: 0, width, height }} />
        </Shader>
      </Fill>
    </Canvas>
  );
}

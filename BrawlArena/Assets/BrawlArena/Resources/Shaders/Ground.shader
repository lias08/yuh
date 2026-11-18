// BrawlArena/Ground – Boden mit Schachbrettmuster im Welt-Raster (1 Kachel = 1 Einheit),
// sanftem Rauschen, Kachelfugen, Toon-Licht und Schattenempfang. Ein Mesh für die ganze Karte.
Shader "BrawlArena/Ground"
{
    Properties
    {
        _ColorA ("Farbe A", Color) = (0.93,0.78,0.52,1)
        _ColorB ("Farbe B", Color) = (0.89,0.72,0.46,1)
        _LineColor ("Fugenfarbe", Color) = (0,0,0,0.08)
        _ShadeColor ("Schattenfarbe", Color) = (0.6,0.55,0.75,1)
        _Offset ("Raster-Versatz", Vector) = (0,0,0,0)
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" "Queue"="Geometry-10" }
        Pass
        {
            Tags { "LightMode"="ForwardBase" }
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_fwdbase nolightmap nodirlightmap nodynlightmap novertexlight
            #include "UnityCG.cginc"
            #include "Lighting.cginc"
            #include "AutoLight.cginc"
            fixed4 _ColorA, _ColorB, _LineColor, _ShadeColor; float4 _Offset;
            struct a { float4 vertex : POSITION; float3 normal : NORMAL; fixed4 color : COLOR; };
            struct v2f { float4 pos : SV_POSITION; float3 wp : TEXCOORD0; fixed4 color : COLOR; SHADOW_COORDS(1) };
            v2f vert(a v)
            {
                v2f o; o.pos = UnityObjectToClipPos(v.vertex);
                o.wp = mul(unity_ObjectToWorld, v.vertex).xyz; o.color = v.color;
                TRANSFER_SHADOW(o);
                return o;
            }
            float hash(float2 p) { return frac(sin(dot(p, float2(127.1, 311.7))) * 43758.5453); }
            fixed4 frag(v2f i) : SV_Target
            {
                float2 g = i.wp.xz + _Offset.xy;
                float2 cell = floor(g);
                float checker = fmod(abs(cell.x + cell.y), 2.0);
                fixed3 col = lerp(_ColorA.rgb, _ColorB.rgb, checker);
                col *= 0.96 + hash(cell) * 0.08;
                float2 f = frac(g);
                float lineMask = 1.0 - smoothstep(0.0, 0.04, min(min(f.x, 1 - f.x), min(f.y, 1 - f.y)));
                col = lerp(col, col * (1 - _LineColor.a * 4), lineMask * _LineColor.a * 6);
                col *= i.color.rgb;
                half atten = SHADOW_ATTENUATION(i);
                fixed3 lit = col * _LightColor0.rgb;
                fixed3 shade = col * _ShadeColor.rgb;
                fixed3 c = lerp(shade, lit, lerp(0.0, 1.0, atten));
                c += col * ShadeSH9(half4(0, 1, 0, 1)) * 0.3;
                return fixed4(c, 1);
            }
            ENDCG
        }
    }
    FallBack Off
}

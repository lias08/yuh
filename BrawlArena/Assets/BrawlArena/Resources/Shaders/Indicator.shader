// BrawlArena/Indicator – Zielanzeige am Boden: weicher Rand + laufende Streifen.
Shader "BrawlArena/Indicator"
{
    Properties
    {
        _Color ("Farbe", Color) = (1,1,1,0.45)
        _EdgeColor ("Randfarbe", Color) = (1,1,1,0.9)
        _Stripes ("Streifen", Float) = 6
    }
    SubShader
    {
        Tags { "RenderType"="Transparent" "Queue"="Transparent+10" "IgnoreProjector"="True" }
        Blend SrcAlpha OneMinusSrcAlpha
        ZWrite Off
        ZTest Always
        Cull Off
        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"
            fixed4 _Color; fixed4 _EdgeColor; float _Stripes;
            struct a { float4 vertex : POSITION; float2 uv : TEXCOORD0; };
            struct v2f { float4 pos : SV_POSITION; float2 uv : TEXCOORD0; };
            v2f vert(a v) { v2f o; o.pos = UnityObjectToClipPos(v.vertex); o.uv = v.uv; return o; }
            fixed4 frag(v2f i) : SV_Target
            {
                float edge = max(smoothstep(0.08, 0.0, i.uv.x), smoothstep(0.92, 1.0, i.uv.x));
                edge = max(edge, smoothstep(0.93, 1.0, i.uv.y));
                float stripe = step(0.5, frac(i.uv.y * _Stripes - _Time.y * 1.5)) * 0.25;
                fixed4 c = _Color;
                c.a = _Color.a * (0.75 + stripe);
                return lerp(c, _EdgeColor, edge);
            }
            ENDCG
        }
    }
}

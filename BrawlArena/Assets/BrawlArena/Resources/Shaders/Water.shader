// BrawlArena/Water – animiertes Cartoon-Wasser mit Wellen und Schaumglanz.
Shader "BrawlArena/Water"
{
    Properties
    {
        _Color ("Wasserfarbe", Color) = (0.25,0.65,0.95,1)
        _DeepColor ("Tiefe", Color) = (0.12,0.40,0.80,1)
        _FoamColor ("Schaum", Color) = (0.9,0.97,1,1)
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" "Queue"="Geometry" }
        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"
            fixed4 _Color, _DeepColor, _FoamColor;
            struct a { float4 vertex : POSITION; };
            struct v2f { float4 pos : SV_POSITION; float3 wp : TEXCOORD0; };
            v2f vert(a v)
            {
                v2f o;
                float3 wp = mul(unity_ObjectToWorld, v.vertex).xyz;
                wp.y += sin(_Time.y * 2.0 + wp.x * 1.5 + wp.z) * 0.03;
                o.wp = wp; o.pos = mul(UNITY_MATRIX_VP, float4(wp, 1));
                return o;
            }
            fixed4 frag(v2f i) : SV_Target
            {
                float t = _Time.y;
                float w = sin(i.wp.x * 2.3 + t * 1.3) * cos(i.wp.z * 2.1 - t * 1.1);
                float w2 = sin((i.wp.x + i.wp.z) * 3.7 + t * 2.0);
                fixed3 col = lerp(_DeepColor.rgb, _Color.rgb, w * 0.3 + 0.6);
                float foam = smoothstep(0.82, 0.95, w * 0.5 + w2 * 0.5);
                col = lerp(col, _FoamColor.rgb, foam * 0.8);
                return fixed4(col, 1);
            }
            ENDCG
        }
    }
}

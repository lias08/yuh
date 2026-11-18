// BrawlArena/UnlitTransparent – halbtransparent, unbeleuchtet (Zonen, Schilde, Gas).
Shader "BrawlArena/UnlitTransparent"
{
    Properties
    {
        _Color ("Farbe", Color) = (1,1,1,0.5)
        _MainTex ("Textur", 2D) = "white" {}
        _Pulse ("Pulsieren", Range(0,1)) = 0
        _Scroll ("UV-Scroll", Vector) = (0,0,0,0)
    }
    SubShader
    {
        Tags { "RenderType"="Transparent" "Queue"="Transparent" "IgnoreProjector"="True" }
        Blend SrcAlpha OneMinusSrcAlpha
        ZWrite Off
        Cull Off
        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"
            fixed4 _Color; sampler2D _MainTex; float4 _MainTex_ST; half _Pulse; float4 _Scroll;
            struct a { float4 vertex : POSITION; float2 uv : TEXCOORD0; fixed4 color : COLOR; };
            struct v2f { float4 pos : SV_POSITION; float2 uv : TEXCOORD0; fixed4 color : COLOR; };
            v2f vert(a v) { v2f o; o.pos = UnityObjectToClipPos(v.vertex); o.uv = TRANSFORM_TEX(v.uv, _MainTex) + _Scroll.xy * _Time.y; o.color = v.color * _Color; return o; }
            fixed4 frag(v2f i) : SV_Target
            {
                fixed4 c = tex2D(_MainTex, i.uv) * i.color;
                c.a *= 1.0 - _Pulse * (0.5 + 0.5 * sin(_Time.y * 6.0)) * 0.5;
                return c;
            }
            ENDCG
        }
    }
}

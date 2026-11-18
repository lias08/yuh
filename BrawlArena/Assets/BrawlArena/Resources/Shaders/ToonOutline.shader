// BrawlArena/ToonOutline – wie Toon, zusätzlich mit dunkler Umrisslinie (Inverted-Hull-Technik).
Shader "BrawlArena/ToonOutline"
{
    Properties
    {
        _Color ("Farbe", Color) = (1,1,1,1)
        _MainTex ("Textur", 2D) = "white" {}
        _ShadeColor ("Schattenfarbe", Color) = (0.55,0.5,0.7,1)
        _RampThreshold ("Licht-Schwelle", Range(0,1)) = 0.5
        _RampSmooth ("Licht-Weichheit", Range(0.001,0.5)) = 0.05
        _RimColor ("Randlicht", Color) = (1,1,1,0.45)
        _RimPower ("Randlicht-Breite", Range(0.5,8)) = 3
        _Emission ("Leuchten", Color) = (0,0,0,0)
        _FlashColor ("Treffer-Blitzfarbe", Color) = (1,1,1,1)
        _FlashAmount ("Treffer-Blitz", Range(0,1)) = 0
        _Wind ("Wind", Range(0,2)) = 0
        _OutlineColor ("Umrissfarbe", Color) = (0.08,0.06,0.12,1)
        _OutlineWidth ("Umrissbreite", Range(0,0.1)) = 0.025
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" "Queue"="Geometry" }
        LOD 200

        Pass
        {
            Tags { "LightMode"="ForwardBase" }
            CGPROGRAM
            #pragma vertex vert_toon
            #pragma fragment frag_toon
            #pragma multi_compile_fwdbase nolightmap nodirlightmap nodynlightmap novertexlight
            #include "ToonCommon.cginc"
            ENDCG
        }

        Pass
        {
            Name "OUTLINE"
            Tags { "LightMode"="Always" }
            Cull Front
            ZWrite On
            CGPROGRAM
            #pragma vertex vert_outline
            #pragma fragment frag_outline
            #include "UnityCG.cginc"
            fixed4 _OutlineColor;
            half _OutlineWidth;
            fixed4 _FlashColor;
            half _FlashAmount;
            struct v2f_o { float4 pos : SV_POSITION; };
            v2f_o vert_outline(appdata_base v)
            {
                v2f_o o;
                float3 wp = mul(unity_ObjectToWorld, v.vertex).xyz;
                float3 wn = normalize(UnityObjectToWorldNormal(v.normal));
                // Breite abhängig von der Kameraentfernung, damit die Linie gleichmäßig wirkt.
                float dist = distance(_WorldSpaceCameraPos.xyz, wp);
                wp += wn * _OutlineWidth * saturate(dist / 12.0) * 1.2;
                o.pos = mul(UNITY_MATRIX_VP, float4(wp, 1));
                return o;
            }
            fixed4 frag_outline(v2f_o i) : SV_Target { return lerp(_OutlineColor, _FlashColor, _FlashAmount * 0.6); }
            ENDCG
        }

        Pass
        {
            Tags { "LightMode"="ShadowCaster" }
            CGPROGRAM
            #pragma vertex vert_shadow
            #pragma fragment frag_shadow
            #pragma multi_compile_shadowcaster
            #include "ToonCommon.cginc"
            ENDCG
        }
    }
    FallBack Off
}

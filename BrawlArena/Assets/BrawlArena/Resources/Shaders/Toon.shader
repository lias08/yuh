// BrawlArena/Toon – Cartoon-Beleuchtung mit harter Licht/Schatten-Kante, Randlicht,
// Schattenempfang und -wurf. Nutzt Vertexfarben (prozedurale Modelle) x _Color x _MainTex.
Shader "BrawlArena/Toon"
{
    Properties
    {
        _Color ("Farbe", Color) = (1,1,1,1)
        _MainTex ("Textur", 2D) = "white" {}
        _ShadeColor ("Schattenfarbe", Color) = (0.55,0.5,0.7,1)
        _RampThreshold ("Licht-Schwelle", Range(0,1)) = 0.5
        _RampSmooth ("Licht-Weichheit", Range(0.001,0.5)) = 0.06
        _RimColor ("Randlicht", Color) = (1,1,1,0.35)
        _RimPower ("Randlicht-Breite", Range(0.5,8)) = 3
        _Emission ("Leuchten", Color) = (0,0,0,0)
        _FlashColor ("Treffer-Blitzfarbe", Color) = (1,1,1,1)
        _FlashAmount ("Treffer-Blitz", Range(0,1)) = 0
        _Wind ("Wind", Range(0,2)) = 0
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

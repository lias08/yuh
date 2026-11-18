// Gemeinsamer Code der BrawlArena-Toon-Shader (Built-in Render Pipeline, mobil-optimiert).
#ifndef BRAWL_TOON_COMMON
#define BRAWL_TOON_COMMON

#include "UnityCG.cginc"
#include "Lighting.cginc"
#include "AutoLight.cginc"

fixed4 _Color;
fixed4 _ShadeColor;
half _RampThreshold;
half _RampSmooth;
fixed4 _RimColor;
half _RimPower;
fixed4 _Emission;
fixed4 _FlashColor;
half _FlashAmount;
half _Wind;
sampler2D _MainTex;
float4 _MainTex_ST;

struct appdata_toon
{
    float4 vertex : POSITION;
    float3 normal : NORMAL;
    float2 uv : TEXCOORD0;
    fixed4 color : COLOR;
};

struct v2f_toon
{
    float4 pos : SV_POSITION;
    float2 uv : TEXCOORD0;
    float3 worldNormal : TEXCOORD1;
    float3 worldPos : TEXCOORD2;
    fixed4 color : COLOR;
    SHADOW_COORDS(3)
};

// Wind: lässt Büsche/Pflanzen leicht schwanken (Höhe über dem Boden bestimmt die Stärke).
float3 ApplyWind(float3 worldPos)
{
    if (_Wind > 0.001)
    {
        float h = saturate(worldPos.y * 1.2);
        float t = _Time.y * 1.7;
        worldPos.x += sin(t + worldPos.x * 1.3 + worldPos.z * 0.7) * 0.06 * h * _Wind;
        worldPos.z += cos(t * 0.8 + worldPos.z * 1.1) * 0.05 * h * _Wind;
    }
    return worldPos;
}

v2f_toon vert_toon(appdata_toon v)
{
    v2f_toon o;
    float3 wp = mul(unity_ObjectToWorld, v.vertex).xyz;
    wp = ApplyWind(wp);
    o.pos = mul(UNITY_MATRIX_VP, float4(wp, 1.0));
    o.worldPos = wp;
    o.worldNormal = UnityObjectToWorldNormal(v.normal);
    o.uv = TRANSFORM_TEX(v.uv, _MainTex);
    o.color = v.color * _Color;
    TRANSFER_SHADOW(o);
    return o;
}

fixed3 ToonLight(float3 normal, float3 worldPos, fixed3 albedo, half atten)
{
    float3 L = normalize(_WorldSpaceLightPos0.xyz);
    half ndl = dot(normal, L);
    half ramp = smoothstep(_RampThreshold - _RampSmooth, _RampThreshold + _RampSmooth, ndl * 0.5 + 0.5);
    ramp *= lerp(0.35, 1.0, atten);
    fixed3 lit = albedo * _LightColor0.rgb;
    fixed3 shade = albedo * _ShadeColor.rgb;
    fixed3 col = lerp(shade, lit, ramp);
    col += albedo * ShadeSH9(half4(normal, 1)) * 0.45;

    float3 V = normalize(_WorldSpaceCameraPos.xyz - worldPos);
    half rim = 1.0 - saturate(dot(V, normal));
    rim = smoothstep(1.0 - 1.0 / max(_RimPower, 0.01), 1.0, rim) * saturate(ndl + 0.6);
    col += _RimColor.rgb * rim * _RimColor.a;
    return col;
}

fixed4 frag_toon(v2f_toon i) : SV_Target
{
    float3 n = normalize(i.worldNormal);
    fixed4 tex = tex2D(_MainTex, i.uv);
    fixed3 albedo = tex.rgb * i.color.rgb;
    half atten = SHADOW_ATTENUATION(i);
    fixed3 col = ToonLight(n, i.worldPos, albedo, atten);
    col += _Emission.rgb * albedo;
    col = lerp(col, _FlashColor.rgb, _FlashAmount);
    return fixed4(col, 1);
}

// --- Schattenwurf ---
struct v2f_shadow { V2F_SHADOW_CASTER; };

v2f_shadow vert_shadow(appdata_base v)
{
    v2f_shadow o;
    float3 wp = mul(unity_ObjectToWorld, v.vertex).xyz;
    wp = ApplyWind(wp);
    v.vertex = mul(unity_WorldToObject, float4(wp, 1));
    TRANSFER_SHADOW_CASTER_NORMALOFFSET(o)
    return o;
}

float4 frag_shadow(v2f_shadow i) : SV_Target { SHADOW_CASTER_FRAGMENT(i) }

#endif

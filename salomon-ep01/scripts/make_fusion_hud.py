"""Génère le modèle de titre Fusion « HUD Urbex » pour DaVinci Resolve.

    python3 scripts/make_fusion_hud.py  →  fusion/HUD Urbex.setting

Le HUD est construit avec des nœuds Fusion simples (Background + RectangleMask,
Text+, Merge). Les réglages (Peur, Stress, Batterie, textes, cases à cocher)
sont rassemblés sur le nœud « HUDControls » et publiés dans l'Inspector de
Resolve, où ils peuvent être animés avec des images clés.

Repère : positions données en pixels sur 1920×1080 (origine en haut à gauche),
converties dans le repère Fusion (0..1, origine en bas à gauche). Les largeurs
et hauteurs de masques et la taille du texte sont relatives à la largeur.
"""
from pathlib import Path

W, H = 1920, 1080
C = "HUDControls"

ORANGE = (1.0, 0.357, 0.102)
RED = (1.0, 0.176, 0.122)
BONE = (0.925, 0.902, 0.855)
DIM = (0.70, 0.68, 0.64)
DARK = (0.03, 0.03, 0.035)

FONT_TXT = ("Bahnschrift", "Bold")
FONT_NUM = ("Consolas", "Bold")
FONT_SYM = ("Segoe UI Symbol", "Regular")

# Échelle du HUD (1 = grand, 0.6 = discret). Les éléments rétrécissent vers
# leur coin d'écran (gauche/droite, haut/bas), le centre reste centré.
SCALE = 0.6
MARGIN = 30  # distance au bord conservée


def X(px: float) -> float:
    """Position horizontale après réduction vers le bord le plus proche."""
    if abs(px - W / 2) < 380:  # bandeau central (alerte) : réduit vers le centre
        return W / 2 + (px - W / 2) * SCALE
    if px < W / 2:
        return MARGIN + (px - MARGIN) * SCALE
    return W - MARGIN - (W - MARGIN - px) * SCALE


def Y(py: float) -> float:
    """Position verticale après réduction vers le bord le plus proche."""
    if py < H / 2:
        return MARGIN + (py - MARGIN) * SCALE
    return H - MARGIN - (H - MARGIN - py) * SCALE


tools: list[str] = []
chain: list[tuple[str, str | None]] = []  # (outil, expression de visibilité)
pos = [0]


def nx(px: float) -> float:
    return round(px / W, 5)


def ny(py: float) -> float:
    return round(1 - py / H, 5)


def wrel(px: float) -> float:
    return round(px / W, 5)


def hrel(px: float) -> float:
    """Hauteur de masque et taille de texte : relatives à la hauteur de l'image."""
    return round(px / H, 5)


def view() -> str:
    pos[0] += 1
    return f"ViewInfo = OperatorInfo {{ Pos = {{ {pos[0] * 110}, {(pos[0] % 4) * 33} }} }},"


def num(value: float | str) -> str:
    """Valeur fixe, ou expression si c'est une chaîne."""
    if isinstance(value, str):
        return f'Input {{ Value = 0, Expression = "{value}", }}'
    return f"Input {{ Value = {value}, }}"


def rect(name: str, cx: float, cy: float, w: float, h: float, color, alpha: float = 1.0,
         show: str | None = None, width_expr: str | None = None, center_expr: str | None = None,
         color_expr: tuple[str, str, str] | None = None, radius: float = 0.0) -> None:
    """Rectangle coloré = Background masqué par un RectangleMask."""
    mask = f"{name}Mask"
    cx, cy, w, h = X(cx), Y(cy), w * SCALE, h * SCALE
    center = (f'Input {{ Value = {{ {nx(cx)}, {ny(cy)} }}, Expression = "{center_expr}", }}'
              if center_expr else f"Input {{ Value = {{ {nx(cx)}, {ny(cy)} }}, }}")
    width = num(width_expr) if width_expr else num(wrel(w))
    tools.append(f"""			{mask} = RectangleMask {{
				CtrlWZoom = false,
				Inputs = {{
					Filter = Input {{ Value = FuID {{ "Fast Gaussian" }}, }},
					MaskWidth = Input {{ Value = {W}, }},
					MaskHeight = Input {{ Value = {H}, }},
					PixelAspect = Input {{ Value = {{ 1, 1 }}, }},
					UseFrameFormatSettings = Input {{ Value = 1, }},
					ClippingMode = Input {{ Value = FuID {{ "None" }}, }},
					Center = {center},
					Width = {width},
					Height = Input {{ Value = {hrel(h)}, }},
					CornerRadius = Input {{ Value = {radius}, }},
				}},
				{view()}
			}},""")
    r, g, b = color
    cr, cg, cb = ((num(f"({e})*{alpha}") for e in color_expr) if color_expr
                  else (num(round(r * alpha, 4)), num(round(g * alpha, 4)), num(round(b * alpha, 4))))
    tools.append(f"""			{name} = Background {{
				CtrlWZoom = false,
				Inputs = {{
					EffectMask = Input {{ SourceOp = "{mask}", Source = "Mask", }},
					GlobalOut = Input {{ Value = 7200, }},
					Width = Input {{ Value = {W}, }},
					Height = Input {{ Value = {H}, }},
					UseFrameFormatSettings = Input {{ Value = 1, }},
					TopLeftRed = {cr},
					TopLeftGreen = {cg},
					TopLeftBlue = {cb},
					TopLeftAlpha = Input {{ Value = {alpha}, }},
				}},
				{view()}
			}},""")
    chain.append((name, show))


def text(name: str, cx: float, cy: float, size_px: float, value: str, color, font=FONT_TXT,
         show: str | None = None, expr: str | None = None, size_expr: str | None = None,
         color_expr: tuple[str, str, str] | None = None, spacing: float = 1.0) -> None:
    cx, cy, size_px = X(cx), Y(cy), size_px * SCALE
    styled = (f'Input {{ Value = "{value}", Expression = "{expr}", }}' if expr
              else f'Input {{ Value = "{value}", }}')
    size = num(size_expr) if size_expr else num(hrel(size_px))
    r, g, b = color
    cr, cg, cb = (num(e) for e in color_expr) if color_expr else (num(r), num(g), num(b))
    tools.append(f"""			{name} = TextPlus {{
				CtrlWZoom = false,
				Inputs = {{
					GlobalOut = Input {{ Value = 7200, }},
					Width = Input {{ Value = {W}, }},
					Height = Input {{ Value = {H}, }},
					UseFrameFormatSettings = Input {{ Value = 1, }},
					Center = Input {{ Value = {{ {nx(cx)}, {ny(cy)} }}, }},
					LayoutRotation = Input {{ Value = 1, }},
					TransformRotation = Input {{ Value = 1, }},
					Red1 = {cr},
					Green1 = {cg},
					Blue1 = {cb},
					Softness1 = Input {{ Value = 1, }},
					StyledText = {styled},
					Font = Input {{ Value = "{font[0]}", }},
					Style = Input {{ Value = "{font[1]}", }},
					Size = {size},
					CharacterSpacing = Input {{ Value = {spacing}, }},
					VerticalJustificationNew = Input {{ Value = 3, }},
					HorizontalJustificationNew = Input {{ Value = 3, }},
				}},
				{view()}
			}},""")
    chain.append((name, show))


# ───────────────────────── Réglages publiés ─────────────────────────

CONTROLS = [
    # nom, libellé, défaut, min, max, type
    ("Peur", "Peur (0-100)", 20, 0, 100, "slider"),
    ("Stress", "Stress (BPM)", 80, 50, 200, "slider"),
    ("Batterie", "Batterie lampe (%)", 70, 0, 100, "slider"),
    ("HeureH", "Heure de départ : heures", 2, 0, 23, "int"),
    ("HeureM", "Heure de départ : minutes", 47, 0, 59, "int"),
    ("IPS", "Images/seconde du projet", 30, 1, 120, "int"),
    ("Alerte", "Afficher l'alerte", 0, 0, 1, "check"),
    ("ShowRec", "Afficher REC", 1, 0, 1, "check"),
    ("ShowHeure", "Afficher l'heure", 1, 0, 1, "check"),
    ("ShowLieu", "Afficher le lieu", 1, 0, 1, "check"),
    ("ShowPeur", "Afficher Peur", 1, 0, 1, "check"),
    ("ShowStress", "Afficher Stress", 1, 0, 1, "check"),
    ("ShowBatterie", "Afficher Batterie", 1, 0, 1, "check"),
    ("EffetPeur", "Bords rouges si peur > 70", 1, 0, 1, "check"),
]


def controls_tool() -> str:
    user = []
    values = []
    for key, label, default, lo, hi, kind in CONTROLS:
        if kind == "check":
            ctrl = f'INPID_InputControl = "CheckboxControl", INP_Integer = true, INP_Default = {default},'
        else:
            integer = "true" if kind == "int" else "false"
            ctrl = (f'INPID_InputControl = "SliderControl", INP_Integer = {integer}, INP_Default = {default}, '
                    f"INP_MinScale = {lo}, INP_MaxScale = {hi}, INP_MinAllowed = {lo}, INP_MaxAllowed = {hi},")
        user.append(f"""					{key} = {{
						LINKS_Name = "{label}",
						LINKID_DataType = "Number",
						{ctrl}
						ICS_ControlPage = "Controls",
					}},""")
        values.append(f"					{key} = Input {{ Value = {default}, }},")
    vals = "\n".join(values)
    uc = "\n".join(user)
    return f"""			{C} = Background {{
				CtrlWZoom = false,
				Inputs = {{
					GlobalOut = Input {{ Value = 7200, }},
					Width = Input {{ Value = {W}, }},
					Height = Input {{ Value = {H}, }},
					UseFrameFormatSettings = Input {{ Value = 1, }},
					TopLeftAlpha = Input {{ Value = 0, }},
{vals}
				}},
				{view()}
				UserControls = ordered() {{
{uc}
				}},
			}},"""


def segments(prefix: str, x0: float, width: float, cy: float, h: float, n: int, show: str) -> None:
    """Fines séparations sombres qui découpent une barre en segments."""
    for i in range(1, n):
        rect(f"{prefix}Gap{i}", x0 + width * i / n, cy, 5, h + 2, DARK, 0.92, show=show)


def corners() -> None:
    """Coins de cadrage façon caméra."""
    m, ln, th = 30, 60, 3
    for i, (x, y, sx, sy) in enumerate([(m, m, 1, 1), (W - m, m, -1, 1), (m, H - m, 1, -1), (W - m, H - m, -1, -1)]):
        rect(f"CornerH{i}", x + sx * ln / 2, y + sy * th / 2, ln, th, BONE, 0.4, show=f"{C}.ShowRec")
        rect(f"CornerV{i}", x + sx * th / 2, y + sy * ln / 2, th, ln, BONE, 0.4, show=f"{C}.ShowRec")


def build() -> str:
    show = lambda key: f"{C}.{key}"  # noqa: E731
    secs = f"floor(time/{C}.IPS)"

    # Bords rouges quand la peur monte
    tools.append(f"""			FearVignetteMask = EllipseMask {{
				CtrlWZoom = false,
				Inputs = {{
					Filter = Input {{ Value = FuID {{ "Fast Gaussian" }}, }},
					MaskWidth = Input {{ Value = {W}, }},
					MaskHeight = Input {{ Value = {H}, }},
					PixelAspect = Input {{ Value = {{ 1, 1 }}, }},
					UseFrameFormatSettings = Input {{ Value = 1, }},
					ClippingMode = Input {{ Value = FuID {{ "None" }}, }},
					Invert = Input {{ Value = 1, }},
					SoftEdge = Input {{ Value = 0.25, }},
					Width = Input {{ Value = 1.1, }},
					Height = Input {{ Value = 1.12, }},
				}},
				{view()}
			}},""")
    tools.append(f"""			FearVignette = Background {{
				CtrlWZoom = false,
				Inputs = {{
					EffectMask = Input {{ SourceOp = "FearVignetteMask", Source = "Mask", }},
					GlobalOut = Input {{ Value = 7200, }},
					Width = Input {{ Value = {W}, }},
					Height = Input {{ Value = {H}, }},
					UseFrameFormatSettings = Input {{ Value = 1, }},
					TopLeftRed = Input {{ Value = 0.48, }},
					TopLeftGreen = Input {{ Value = 0.036, }},
					TopLeftBlue = Input {{ Value = 0.024, }},
					TopLeftAlpha = Input {{ Value = 0.6, }},
				}},
				{view()}
			}},""")
    chain.append(("FearVignette",
                  f"{C}.EffetPeur*min(1, max(0, ({C}.Peur-70)/30))*(0.8+0.2*sin(time/4))"))

    corners()

    # REC + compteur
    text("RecDot", 88, 80, 34, "●", RED, FONT_SYM, show=f"{C}.ShowRec*iif(time % 30 < 18, 1, 0.15)")
    text("RecText", 250, 80, 30, "REC", BONE, FONT_NUM, show=show("ShowRec"),
         expr=f"Text('REC  ' .. string.format('%02d:%02d:%02d', floor({secs}/3600), floor({secs}/60)%60, {secs}%60))")

    # Lieu
    rect("LieuPlate", 330, 175, 540, 104, DARK, 0.42, show=show("ShowLieu"))
    rect("LieuBar", 62, 175, 5, 104, ORANGE, show=show("ShowLieu"))
    text("TxtLieu", 330, 160, 38, "SANATORIUM ABANDONNÉ", BONE, show=show("ShowLieu"))
    text("TxtSousLieu", 330, 205, 22, "AILE NORD - SOUS-SOL", ORANGE, FONT_NUM, show=show("ShowLieu"))

    # Heure locale (avance avec la vidéo)
    t = f"({C}.HeureH*3600 + {C}.HeureM*60 + {secs})"
    text("TxtHeure", 1730, 82, 46, "02:47:00", BONE, FONT_NUM, show=show("ShowHeure"),
         expr=f"Text(string.format('%02d:%02d:%02d', floor({t}/3600)%24, floor({t}/60)%60, {t}%60))")
    text("TxtHeureLabel", 1760, 128, 18, "HEURE LOCALE", DIM, FONT_NUM, show=show("ShowHeure"))

    # PEUR
    danger = f"{C}.Peur >= 70"
    rect("PeurPlate", 330, 825, 540, 112, DARK, 0.42, show=show("ShowPeur"))
    rect("PeurBar", 62, 825, 5, 112, ORANGE, show=show("ShowPeur"),
         color_expr=(f"iif({danger}, {RED[0]}, {ORANGE[0]})", f"iif({danger}, {RED[1]}, {ORANGE[1]})", f"iif({danger}, {RED[2]}, {ORANGE[2]})"))
    text("TxtPeur", 150, 800, 28, "PEUR", BONE, show=show("ShowPeur"), spacing=1.15)
    text("TxtPeurVal", 525, 800, 34, "20%", BONE, FONT_NUM, show=show("ShowPeur"),
         expr=f"Text(floor({C}.Peur) .. '%')",
         color_expr=(f"iif({danger}, {RED[0]}, {BONE[0]})", f"iif({danger}, {RED[1]}, {BONE[1]})", f"iif({danger}, {RED[2]}, {BONE[2]})"))
    rect("PeurTrack", 330, 852, 490, 20, BONE, 0.15, show=show("ShowPeur"))
    rect("PeurFill", 330, 852, 490, 20, ORANGE, show=show("ShowPeur"),
         width_expr=f"{wrel(490 * SCALE)}*{C}.Peur/100",
         center_expr=f"Point({nx(X(85))} + {wrel(490 * SCALE)}*{C}.Peur/200, {ny(Y(852))})",
         color_expr=(f"iif({danger}, {RED[0]}, {ORANGE[0]})", f"iif({danger}, {RED[1]}, {ORANGE[1]})", f"iif({danger}, {RED[2]}, {ORANGE[2]})"))
    segments("Peur", 85, 490, 852, 20, 20, show("ShowPeur"))

    # STRESS (cœur qui bat au rythme des BPM)
    high = f"{C}.Stress >= 120"
    rect("StressPlate", 330, 960, 540, 112, DARK, 0.42, show=show("ShowStress"))
    rect("StressBar", 62, 960, 5, 112, ORANGE, show=show("ShowStress"),
         color_expr=(f"iif({high}, {RED[0]}, {ORANGE[0]})", f"iif({high}, {RED[1]}, {ORANGE[1]})", f"iif({high}, {RED[2]}, {ORANGE[2]})"))
    text("Coeur", 100, 935, 30, "♥", RED, FONT_SYM, show=show("ShowStress"),
         size_expr=f"{hrel(34 * SCALE)}*(1 + 0.25*max(0, sin(time/{C}.IPS*{C}.Stress/60*6.28318))^8)",
         color_expr=(f"iif({high}, {RED[0]}, {ORANGE[0]})", f"iif({high}, {RED[1]}, {ORANGE[1]})", f"iif({high}, {RED[2]}, {ORANGE[2]})"))
    text("TxtStress", 200, 935, 28, "STRESS", BONE, show=show("ShowStress"), spacing=1.15)
    text("TxtStressVal", 490, 935, 34, "80 BPM", BONE, FONT_NUM, show=show("ShowStress"),
         expr=f"Text(floor({C}.Stress) .. ' BPM')",
         color_expr=(f"iif({high}, {RED[0]}, {BONE[0]})", f"iif({high}, {RED[1]}, {BONE[1]})", f"iif({high}, {RED[2]}, {BONE[2]})"))
    level = f"min(1, max(0, ({C}.Stress-60)/130))"
    rect("StressTrack", 330, 987, 490, 20, BONE, 0.15, show=show("ShowStress"))
    rect("StressFill", 330, 987, 490, 20, ORANGE, show=show("ShowStress"),
         width_expr=f"{wrel(490 * SCALE)}*{level}",
         center_expr=f"Point({nx(X(85))} + {wrel(490 * SCALE)}*{level}/2, {ny(Y(987))})",
         color_expr=(f"iif({high}, {RED[0]}, {ORANGE[0]})", f"iif({high}, {RED[1]}, {ORANGE[1]})", f"iif({high}, {RED[2]}, {ORANGE[2]})"))
    segments("Stress", 85, 490, 987, 20, 20, show("ShowStress"))

    # BATTERIE de la lampe (clignote sous 20 %)
    low = f"{C}.Batterie < 20"
    mid = f"{C}.Batterie < 45"
    blink = f"{C}.ShowBatterie*iif({low}, iif(time % 20 < 10, 1, 0.35), 1)"
    rect("BattPlate", 1700, 975, 360, 92, DARK, 0.42, show=show("ShowBatterie"))
    text("TxtLampe", 1568, 975, 22, "LAMPE", DIM, FONT_NUM, show=blink)
    rect("BattOuter", 1665, 975, 132, 52, BONE, show=blink)
    rect("BattInner", 1665, 975, 122, 42, DARK, show=blink)
    rect("BattTip", 1736, 975, 8, 20, BONE, show=blink)
    rect("BattFill", 1665, 975, 114, 34, (0.6, 0.89, 0.43), show=blink,
         width_expr=f"{wrel(114 * SCALE)}*{C}.Batterie/100",
         center_expr=f"Point({nx(X(1608))} + {wrel(114 * SCALE)}*{C}.Batterie/200, {ny(Y(975))})",
         color_expr=(f"iif({low}, {RED[0]}, iif({mid}, 1.0, 0.6))", f"iif({low}, {RED[1]}, iif({mid}, 0.69, 0.89))", f"iif({low}, {RED[2]}, iif({mid}, 0.1, 0.43))"))
    text("TxtBatt", 1820, 975, 34, "70%", BONE, FONT_NUM, show=blink,
         expr=f"Text(floor({C}.Batterie) .. '%')",
         color_expr=(f"iif({low}, {RED[0]}, {BONE[0]})", f"iif({low}, {RED[1]}, {BONE[1]})", f"iif({low}, {RED[2]}, {BONE[2]})"))

    # ALERTE au centre
    alert = f"{C}.Alerte*iif(time % 24 < 18, 1, 0.6)"
    rect("AlertBorder", 960, 200, 680, 104, RED, show=f"{C}.Alerte")
    rect("AlertPlate", 960, 200, 668, 92, (0.04, 0.025, 0.025), 0.9, show=f"{C}.Alerte")
    text("AlertIcon", 690, 198, 56, "⚠", RED, FONT_SYM, show=alert)
    text("TxtAlerte", 990, 200, 60, "BRUIT SUSPECT", BONE, show=alert, spacing=1.08)

    # Chaîne de Merge (ordre d'affichage)
    merges = []
    prev = C
    for i, (name, vis) in enumerate(chain, start=1):
        blend = f'Input {{ Value = 1, Expression = "{vis}", }},' if vis else "Input { Value = 1, },"
        merges.append(f"""			Merge{i} = Merge {{
				CtrlWZoom = false,
				Inputs = {{
					Background = Input {{ SourceOp = "{prev}", Source = "Output", }},
					Foreground = Input {{ SourceOp = "{name}", Source = "Output", }},
					Blend = {blend}
					PerformDepthMerge = Input {{ Value = 0, }},
				}},
				{view()}
			}},""")
        prev = f"Merge{i}"

    final = f"""			HUDSize = Transform {{
				CtrlWZoom = false,
				Inputs = {{
					Input = Input {{ SourceOp = "{prev}", Source = "Output", }},
				}},
				{view()}
			}},"""

    # Entrées publiées dans l'Inspector de Resolve
    published = []
    k = 0

    def pub(op: str, src: str, name: str, page: str = "Controls", default: float | None = None) -> None:
        nonlocal k
        k += 1
        d = f" Default = {default}," if default is not None else ""
        published.append(f'			Input{k} = InstanceInput {{ SourceOp = "{op}", Source = "{src}", Name = "{name}", Page = "{page}",{d} }},')

    for key, label, default, *_ in CONTROLS[:3]:
        pub(C, key, label, default=default)
    pub("TxtLieu", "StyledText", "Lieu")
    pub("TxtSousLieu", "StyledText", "Sous-titre du lieu")
    pub("TxtAlerte", "StyledText", "Texte de l'alerte")
    for key, label, default, *_ in CONTROLS[3:]:
        pub(C, key, label, default=default)
    pub("HUDSize", "Size", "Taille globale", default=1)
    pub("HUDSize", "Center", "Position globale")

    body = "\n".join([controls_tool(), *tools, *merges, final])
    inputs = "\n".join(published)
    return f"""{{
	Tools = ordered() {{
		HUD_Urbex = MacroOperator {{
			CtrlWZoom = false,
			NameSet = true,
			Inputs = ordered() {{
{inputs}
			}},
			Outputs = {{
				MainOutput1 = InstanceOutput {{ SourceOp = "HUDSize", Source = "Output", }},
			}},
			ViewInfo = GroupInfo {{ Pos = {{ 0, 0 }} }},
			Tools = ordered() {{
{body}
			}},
		}},
	}},
	ActiveTool = "HUD_Urbex",
}}
"""


if __name__ == "__main__":
    out = Path(__file__).resolve().parent.parent / "fusion" / "HUD Urbex.setting"
    out.parent.mkdir(exist_ok=True)
    out.write_text(build(), encoding="utf-8")
    print(out, f"{len(tools) + len(chain) + 2} nœuds")

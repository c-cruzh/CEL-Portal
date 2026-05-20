# Paquete Maestro — Piloto de Pronóstico Hidrológico con IA
### Proceso CEL-CFU 02/26 · Alineación técnica-contractual, gobernanza e infraestructura · Fase 0

Este paquete consolida la documentación de alineación del piloto de pronóstico hidrológico avanzado basado en inteligencia artificial para la Comisión Ejecutiva Hidroeléctrica del Río Lempa (CEL). Integra la readecuación técnica-contractual frente a la infraestructura adquirida, la estructura de gobernanza y roles, la delimitación de alcance y handoff de infraestructura, los diagramas de arquitectura y la documentación de referencia del proveedor.

Todo el material es **client-facing** y está organizado por tema para facilitar su revisión, validación y formalización.

---

## Cómo está organizado

```
Paquete_Maestro_Piloto_CEL/
├── README.md
├── 01_Alineacion_Tecnica_y_Contractual/
├── 02_Gobernanza_Roles_y_Sesiones/
├── 03_Infraestructura_BOM_y_Handoff/
├── 04_Referencia_Proveedor/
└── 05_Diagramas/
```

---

## Orden de lectura sugerido

1. **Empezar por `01` — Alineación Técnica y Contractual.** Es el documento maestro. Establece la postura, reconcilia el DSP con la infraestructura adquirida y contiene las siete partes (anexo sustitutivo, matriz de cambios, delimitación de alcance, checklist de Fase 0, gates y ruta crítica, cláusulas defendibles y carta formal de remisión).
2. **Seguir con `03` — Infraestructura, BOM y Handoff.** Aterriza la arquitectura física adquirida, el BOM actualizado de hardware/software y la delimitación operativa de responsabilidades para iniciar y cerrar la Fase 0.
3. **Revisar `02` — Gobernanza, Roles y Sesiones.** Documenta la estructura organizativa, la matriz de roles y el registro de las sesiones de coordinación.
4. **Consultar `05` — Diagramas** en paralelo, como apoyo visual a las secciones anteriores.
5. **Usar `04` — Referencia del Proveedor** como fuente de verdad de la oferta aceptada cuando se requiera el detalle de la plataforma adquirida.

---

## Contenido por carpeta

### 01 · Alineación Técnica y Contractual
| Archivo | Descripción |
|---|---|
| `Alineacion_Tecnica_Contractual_AI_Silo_CEL_Fase0.docx` | Documento maestro de alineación. Reconcilia la documentación del DSP con la infraestructura efectivamente adquirida, sin ampliar el alcance contractual. Incluye anexo técnico sustitutivo, matriz de cambios (antes/deprecated/reemplazo), delimitación contractual de alcance, checklist operativo de Fase 0, gates y ruta crítica, cláusulas defendibles para adenda/nota aclaratoria, y carta formal de remisión a CEL. |

### 02 · Gobernanza, Roles y Sesiones
| Archivo | Descripción |
|---|---|
| `Minuta_formal_sesion_Piloto_CEL.docx` | Registro oficial de la sesión de coordinación: identificación, participantes, gobernanza y roles, dinámica de escalación con la Unidad de Informática, estado de la Fase 0, acuerdos y acciones. |
| `Comunicacion_Seguimiento_Apr1_Seccion10_RACI_FTE.pdf` | Comunicación de seguimiento con el refresh de la Sección 10 (recursos humanos), la matriz RACI por fase y el modelo de asignación de esfuerzo (FTE). |

### 03 · Infraestructura, BOM y Handoff
| Archivo | Descripción |
|---|---|
| `Anexo_Complementario_BOM_Diagrama_AI_Silo_CEL_Fase0.docx` | BOM actualizado de hardware y software sobre la plataforma adquirida (Dell/Martinexsa), arquitectura por capas, separación entre base provista por la plataforma y stack funcional del piloto, decisiones técnicas pendientes y texto sustitutivo para los Anexos B/C del DSP. |
| `Handoff_Alcance_CEL_Martinexsa_Informacion_Requerida_Fase0.docx` | Delimitación de responsabilidades CEL / Martinexsa / Dell, matriz operativa, información requerida antes de iniciar la ejecución plena (INF-01 a INF-24), gates de inicio/ejecución/cierre y exclusiones que no deben trasladarse a la Consultora. |
| `Paquete_Complementario_AI_Silo_CEL_Fase0_v2.docx` | Documento de ensamblaje que describe el uso recomendado de los anexos complementarios (lectura de trabajo vs. anexos firmables). |

### 04 · Referencia del Proveedor
| Archivo | Descripción |
|---|---|
| `Aceptacion_Oferta_Martinexsa_Dell.pdf` | Oferta aceptada de Martinexsa / Dell Technologies para la Plataforma Integral de IA y Procesamiento de Datos. Fuente de verdad de la infraestructura física adquirida (servidores PowerEdge R770/R570, switch S5224F-ON, GPU H100 NVL, soporte y licenciamiento). |

### 05 · Diagramas
| Archivo | Descripción |
|---|---|
| `architecture_scope_final.png` | Arquitectura lógica del AI Silo y frontera de alcance: insumos, plataforma física provista por CEL/Martinexsa/Dell, stack funcional de la Consultora y salidas operativas. |
| `handoff_scope_boundary.png` | Secuencia de handoff y gates: dependencias de CEL/TI y proveedor → handoff mínimo → ejecución de la Consultora → certificación de Fase 0. |
| `Diagrama_Arquitectura_AI_Silo_y_Alcance.mmd` | Código fuente (Mermaid) de la arquitectura y frontera de alcance, en su versión detallada y editable. |
| `Diagrama_Gobernanza_Organizacional.mmd` | Código fuente (Mermaid) del organigrama de gobernanza del piloto, editable. |
| `Diagrama_Arquitectura_Logica_Funcional_AI_Silo.mmd` | Código fuente (Mermaid) de la vista lógica/funcional por capas: inputs, acceso/seguridad, orquestación, ingeniería de datos, almacenamiento, modelado, productos de decisión, interfaz/entrega y usuarios, con los lazos de validación. |
| `Diagrama_Topologia_Fisica_Data_Center.mmd` | Código fuente (Mermaid) de la topología física del data center: edge externo, frontera de seguridad, facility, fabric de red con VLANs, plano de management/soporte (iDRAC, ProSupport, TechCircle), capa de servidores Dell, endpoints, landing zone del workload y nota de frontera de alcance. |

---

## Principios transversales del paquete

- **Adherencia al DSP.** La obligación contractual permanece anclada al alcance del proceso CEL-CFU 02/26. La infraestructura adquirida se consume como entorno habilitante, no como ampliación de alcance.
- **No ampliación automática.** Ningún componente, licencia o servicio adicional adquirido por CEL constituye obligación adicional de la Consultora salvo modificación contractual expresa.
- **Mage como capa operativa.** La orquestación y observabilidad operativa de pipelines se centraliza en Mage; Pentaho y Grafana quedan fuera del piloto.
- **Inicio efectivo de Fase 0.** La ejecución técnica plena se computa desde el handoff técnico mínimo del entorno, no desde hitos administrativos de adquisición.

---

## Asuntos por definir (a confirmar por CEL/TI)

- Host final de Mage, PostgreSQL/PostGIS, MongoDB y dashboard/API dentro de la arquitectura Dell.
- GPU efectiva instalada y su validación funcional contra la entrega física.
- Rol e involucramiento del equipo de dirección del piloto.
- Confirmaciones del handoff (accesos, red, storage, soporte) detalladas en los documentos de la carpeta `03`.

---

*Documentación preparada para revisión institucional · Proceso CEL-CFU 02/26.*

---
lang: es
title: "Especialista en Integración de OpenClaw/NanoClaw y el Hub Agentic Space"
description: "Configure un agente utilizando OpenClaw, NanoClaw o una plataforma compatible, documente todo el proceso e intégrelo al Hub Agentic Space."
headerImage: ""
status: "liberado"
certificatePhaseId: "2"
cashbackRate: 0
requiredCertificateIds: []
---

# Especialista en Integración de OpenClaw/NanoClaw y el Hub Agentic Space

El objetivo de este desafío es configurar un agente utilizando **OpenClaw, NanoClaw o plataforma compatible**, documentar todo el proceso e integrarlo al Hub **Agentic Space**.

## Conocimientos y Habilidades Desarrollados

Al concluir los desafíos propuestos en el proceso de aprendizaje orientado por desafíos del **Agentic Space**, el participante podrá desarrollar y demostrar conocimientos teóricos y habilidades prácticas relacionadas con la creación, configuración, integración y operación de agentes de Inteligencia Artificial.

Entre las principales competencias trabajadas están:

- **Fundamentos de ingeniería de prompts**, incluyendo estructuración de instrucciones, definición de contexto, restricciones, objetivos, formatos de respuesta y criterios de validación;
- **Elaboración de prompts para agentes de IA**, considerando identidad, función, comportamiento, memoria, límites operacionales e interacción con usuarios, sistemas y otros agentes;
- **Comprensión del funcionamiento de agentes basados en OpenClaw, NanoClaw y plataformas similares**, reconociendo sus principales componentes, ciclos de ejecución y mecanismos de toma de decisiones;
- **Comprensión de la infraestructura utilizada por agentes**, incluyendo modelos de lenguaje, herramientas, skills, APIs, memoria, sistemas de archivos, bases de datos y servicios externos;
- **Configuración y gestión de entornos aislados de ejecución — sandboxes**, utilizados para limitar el acceso de los agentes a archivos, procesos, redes, credenciales y recursos computacionales;
- **Aplicación de principios de seguridad en sistemas agenticos**, como privilegio mínimo, separación de responsabilidades, control de acceso, validación de entradas, protección de credenciales y auditoría de acciones;
- **Comprensión de la arquitectura y del funcionamiento del Hub Agentic Space**, responsable de integrar agentes, usuarios, servicios, herramientas y aplicaciones distribuidas;
- **Integración de agentes con el Agentic Space**, incluyendo registro, autenticación, configuración, publicación de capacidades y comunicación con los servicios disponibilizados por el Hub;
- **Comprensión de protocolos y mecanismos de orquestación de agentes**, permitiendo que diferentes agentes cooperen, distribuyan tareas y compartan resultados de manera coordinada;
- **Integración de agentes mediante APIs RESTful**, utilizando operaciones HTTP, endpoints, autenticación, estructuras JSON, tratamiento de respuestas y gestión de errores;
- **Comprensión de la comunicación entre agentes y sistemas externos**, incluyendo conceptos de Agent-to-Agent — A2A —, Model Context Protocol — MCP —, webhooks, colas de mensajes y arquitecturas orientadas a eventos;
- **Desarrollo de flujos de trabajo agenticos**, en los que tareas complejas se dividen entre agentes especializados, herramientas y servicios;
- **Monitoreo, registro y auditoría de las acciones ejecutadas por los agentes**, posibilitando rastreabilidad, identificación de fallas y análisis del comportamiento del sistema;
- **Pruebas y depuración de agentes**, evaluando respuestas, uso de herramientas, ejecución de tareas, fallas de integración y posibles comportamientos inesperados;
- **Evaluación de la calidad y confiabilidad de los resultados producidos por agentes**, considerando criterios como precisión, consistencia, seguridad, rastreabilidad y cumplimiento de los objetivos definidos;
- **Desarrollo de una visión crítica sobre sistemas de Inteligencia Artificial agentica**, comprendiendo sus posibilidades, limitaciones, riesgos y aplicaciones prácticas.

## Instrucciones

### 1. Cree el repositorio

Cree un repositorio público en GitHub exclusivamente para documentar el desafío.

En la raíz del repositorio deberá existir únicamente el archivo:

```text
README.md
```

El `README.md` debe presentar:

- nombre y objetivo del proyecto;
- descripción resumida del agente;
- tecnologías utilizadas;
- enlace del perfil del agente en el Agentic Space;
- nombre y datos de contacto del alumno.

### 2. Organice la estructura

El repositorio deberá poseer exactamente las siguientes carpetas:

```text
/
├── README.md
├── docs/
├── prompts/
└── config/
```

#### `docs/`

Debe contener la documentación del proceso en archivos Markdown.

Incluya capturas de pantalla en los formatos `.jpg`, `.png` o `.gif`, mostrando:

- instalación o preparación del entorno;
- creación del agente;
- comandos utilizados;
- parametrización;
- ejecución e interacción por el terminal;
- pruebas realizadas;
- registro en el Agentic Space;
- proceso de integración con el Hub.

#### `prompts/`

Debe contener los archivos de definición y orientación del agente, incluyendo, cuando aplique:

- identidad;
- función;
- objetivos;
- reglas de comportamiento;
- contexto operativo;
- instrucciones de uso de herramientas;
- límites y restricciones;
- ejemplos de interacción.

#### `config/`

Debe contener una copia de la configuración utilizada por OpenClaw o NanoClaw.

Ejemplo de origen:

```bash
~/.config/openclaw.json
```

Antes de publicar, elimine o reemplace por valores ficticios toda la información sensible, como:

- claves de API;
- tokens de acceso;
- contraseñas;
- cookies;
- claves privadas;
- credenciales de base de datos;
- direcciones internas o datos personales.

### 3. Configure el agente

Utilizando la línea de comandos:

1. instale y configure el OpenClaw, NanoClaw o sistema compatible;
2. cree el agente;
3. defina su identidad, función y objetivos;
4. configure los prompts y parámetros operacionales;
5. configure herramientas, permisos y sandbox;
6. ejecute pruebas de interacción;
7. registre los resultados en la carpeta `docs`.

### 4. Realice la preparación inicial

Realice la parametrización y la preparación inicial del agente utilizando ejemplos, instrucciones y pruebas coherentes con su función.

Documente:

- comandos ejecutados;
- prompts utilizados;
- respuestas obtenidas;
- ajustes realizados;
- resultado final de las pruebas.

### 5. Regístrese en el Agentic Space

Acceda: **https://agenticspace.vercel.app**

Realice el registro del agente y complete correctamente la información solicitada, incluyendo su descripción, finalidad y capacidades.

Después del registro, siga las instrucciones presentadas por el Agentic Space para integrar el agente al Hub.

### 6. Pruebe la integración

Una vez concluida la integración:

- confirme que el agente puede comunicarse con el Hub;
- realice al menos una operación o interacción de prueba;
- registre evidencias de la ejecución;
- añada las capturas de pantalla y la descripción de la prueba a la carpeta `docs`;
- informe en el `README.md` la dirección del agente registrado.

### 7. Entrega para la certificación

Para comprobar la ejecución del desafío y solicitar la evaluación, envíe el enlace del repositorio GitHub según las orientaciones de la plataforma.

El repositorio deberá estar organizado, ser accesible y contener evidencias suficientes para verificar todas las etapas realizadas.

Las dudas sobre el desafío deberán enviarse a: **[desafios@rapport.tec.br](mailto:desafios@rapport.tec.br)**

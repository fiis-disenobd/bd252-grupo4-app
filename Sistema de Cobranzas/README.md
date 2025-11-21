# MÓDULOS DEL SISTEMA DE COBRANZA:

|  N°   | Nombre del módulo | Responsabilidades |
|  :-:  | ----------------- | ----------------- |
| **1** | **Módulo de Seguridad** |Administra a los usuarios del sistema, asignando roles y permisos de acceso según el perfil de cada uno, garantizando que solo las personas autorizadas puedan ejecutar determinadas funciones.|
| **2** | **Módulo de Programación de Recursos** |Se encarga de crear y asignar tickets de cobranza a los operadores con clientes importantes, controlar el inicio y fin de las actividades y dar seguimiento al estado de cada gestión programada.|
| **3** | **Módulo de Operaciones** |Gestiona la ejecución diaria de las cobranzas, incluyendo el envío de mensajes, llamadas y notificaciones a los clientes, así como el registro de las respuestas que se reciben. Controla el estado de cada acción realizada.|
| **4** | **Módulo de Estrategias** |Define las políticas y métodos que guían las gestiones de cobranza, como la frecuencia de llamadas, el número de correos o mensajes SMS, y los criterios para seleccionar clientes o segmentos.|
| **5** | **Módulo de Metas y Reportes** |Se encarga de definir las metas de recuperación de deuda (por monto, periodo o segmento de clientes) y monitorear si se están cumpliendo. Genera reportes sobre clientes morosos, deudas vencidas y resultados de las gestiones, además de indicadores clave que permiten evaluar la efectividad de las estrategias y el desempeño de los operadores. Este módulo sirve de retroalimentación para la planificación y la toma de decisiones.|

# REQUERIMIENTOS DEL SISTEMA DE COBRANZAS:
- GENERALES:
    - En la parte izquierda debe haber un panel donde arriba contenga el logo de Interbank (https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Interbank_logo.svg/2560px-Interbank_logo.svg.png), luego abajo del logo debe decir "Área de Cobranzas", luego abajo de eso deben ir 5 botones correspondientes a los 5 módulos


- MODULO 1:

|Requerimiento| Nombre                     |
|:-----------:|----------------------------|
|    R101     | Registro de usuarios       |
|    R102     | Otorgamiento de permisos   |
|    R103     | Recuperación de contraseña |
|    R104     | Autenticación Multifactor  |

- MODULO 2:


|Requerimiento|               Nombre                  |
|:-----------:|---------------------------------------|
|    R201     |Validación de la cartera de cliente    |
|    R202     |Clasificación de los deudores          |
|    R203     |Asignación Manual de Recurso Humano    |  
|    R204     |Cambio de estado por vencimiento       | 
|    R205     |Consultar la programación              |
|    R206     |Consultar el historial de los clientes |


- MODULO 3:

| Requerimiento|                  Nombre                    |
|:------------:|--------------------------------------------|
|     R301     |Identificación de cliente                   |
|     R302     |Envío de notificaciónd de cobranza (mensaje)|  
|     R303     |Registro de Interacción del Cliente         | 
|     R304     |Derivación a Protesto o Legal               | 

- MODULO 4:

|Requerimiento|              Nombre                 |
|:-----------:|-------------------------------------|
|    R401     | Visualizar historial de estrategias |
|    R402     | Crear estrategia                    |
|    R403     | Configurar canales de estrategia    |
|    R404     | Asociar plantillas a estrategia     |
|    R405     | Definir incentivos en estrategia    |
|    R406     | Configurar refinanciamiento         |


- MODULO 5:

| Requerimiento |               Nombre                 |
|:-------------:|--------------------------------------|
|     R501      | Configurar metas de recuperación     |
|     R502      | Monitorear cumplimiento de metas     |
|     R503      | Reporte de morosidad                 |
|     R504      | Productividad por asesor y equipo    |
|     R505      | Efectividad de estrategias y canales |
|     R506      | Alertas por umbrales                 |


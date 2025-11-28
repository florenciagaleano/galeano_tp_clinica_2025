---
applyTo: '**'
---
Estas son las instrucciones para realizar el trabajo practico "TP_CLINICA":
Debemos realizar un sistema según las necesidades y deseos del cliente, para eso tenemos una breve
descripción de lo que el cliente nos comenta acerca de su negocio:
“La Clínica OnLine, especialista en salud, cuenta actualmente con 6 consultorios, dos laboratorios físicos en
la clínica, y una sala de espera general. Está abierta al público de lunes a viernes de 8:00 a 19:00, y los
sábados de 8:00 a 14:00. En ella trabajan profesionales de diversas especialidades, que ocupan los
consultorios acorde a su disponibilidad, recibiendo pacientes con turno para consulta o tratamiento. Los
turnos son solicitados a través de la web, seleccionando el profesional o la especialidad. La duración mínima
de un turno es de 30 minutos, pero los profesionales pueden modificarla según su especialidad. Estos
profesionales pueden tener más de una especialidad. Además, contamos con un sector que se encarga de la
organización y administración de la clínica. “

Sprint 1
● Requerimientos mínimos:
○ Favicon.
○ Subido a la web.
○ Loading en pantallas de carga.

En esta entrega debemos tener la posibilidad de registrarse, ingresar al sistema y administrar los
usuarios que van a poder utilizar nuestra plataforma. A continuación se detallan algunas
especificaciones:

1

● Página de bienvenida:
○ Tiene que tener los accesos al login y registro del sistema.

● Registro
○ Desde esta sección vamos a poder registrar pacientes y especialistas.
○ Para los pacientes los datos serán:
■ Nombre
■ Apellido
■ Edad
■ DNI
■ Obra Social
■ Mail
■ Contraseña
■ 2 imágenes para su perfil.
○ Para los Especialistas los datos serán:
■ Nombre
■ Apellido
■ Edad
■ DNI
■ Especialidad
● En este caso se le deberá dar la posibilidad de elegir o agregar alguna que no se
encuentre entre las posibilidades

■ Mail
■ Contraseña
■ Imagen de perfil
○ Debemos validar los campos según corresponda.
● Login
○ Desde esta sección vamos a ingresar al sistema.
○ Debe contar con los botones de acceso rápido.
○ Los usuarios con perfil Especialista solo pueden ingresar si un usuario administrador aprobó
su cuenta y verificó el mail al momento de registrarse.
○ Los usuarios con perfil Paciente solo pueden ingresar si verificaron su mail al
momento de registrarse.

● Sección Usuarios
○ Esta sección solamente la va a poder ver el usuario con perfil Administrador.
○ Además de ver la información de los usuarios, desde esta sección se deberá habilitar o
inhabilitar el acceso al sistema de los usuarios Especialista.
○ También se podrá generar nuevos usuarios, con el mismo requerimiento que en la sección
registro.
■ Se suma la posibilidad de generar un usuario Administrador.
■ Para los usuarios Administrador:
● Nombre

2

● Apellido
● Edad
● DNI
● Mail
● Password
● imágen para su perfil.

Sprint 2
● Requerimientos mínimos:
○ Captcha: puede ser el de google o uno propio, debemos incorporarlo en el registro de los
usuarios.
○ Readme: debe contener una explicación de la Clínica, pantallas, formas de acceder a las diferentes secciones y que contiene cada sección.

En esta entrega nos vamos a encargar de la carga y visualización de turnos. Debemos incorporar las
siguientes secciones:
● Mis Turnos
○ Como PACIENTE
■ Solo tendrá acceso el Paciente y le mostrará los turnos que él solicitó.
■ Esta sección deberá contar con un filtro único donde podrá filtrar por:
● Especialidad
● Especialista
● NO UTILIZAR Combobox
■ A su vez desde este listado podrá realizar las siguientes acciones:
● Cancelar turno
○ Solamente debe ser visible si el turno no fue realizado.
○ Debe dejar un comentario del porque se cancela el turno.
● Ver reseña.
○ Solo debe ser visible si el turno tiene un comentario o reseña cargado.
● Completar encuesta.
○ Solamente debe estar visible si el especialista marcó el turno como
realizado y dejó la reseña.

● Calificar Atención
○ Solamente debe ser visible una vez que el turno sea realizado.
○ El paciente debe dejar un comentario de como fue la atención del
Especialista.

● Debe estar bien visible el estado del turno.
● Solamente mostrar la acción que puede realizar el usuario.

○ Como ESPECIALISTA
■ Solo tendrá acceso el Especialista y le mostrará los turnos que tiene
asignados.
■ Esta sección deberá contar con un filtro único donde podrá filtrar por:
● Especialidad
● Paciente
● NO UTILIZAR Combobox
■ A su vez desde este listado podrá realizar las siguientes acciones:

3

● Cancelar turno
○ Solamente debe ser visible si el turno no fue Aceptado, Realizado
o Rechazado.
○ Para cancelar el turno se debe dejar un comentario del porque se
cancela el mismo.
● Rechazar turno
○ Solamente debe ser visible si el turno no fue Aceptado, Realizado
o Cancelado.
○ Para rechazar el turno se debe dejar un comentario del porque se
rechaza el mismo.

● Aceptar turno
○ Solamente debe ser visible si el turno no fue Realizado, Cancelado
o Rechazado.
● Finalizar Turno
○ Solamente debe ser visible si el turno fue Aceptado.
○ Para finalizar el turno se debe dejar una reseña o comentario de la
consulta y diagnóstico realizado.

● Ver Reseña
○ Solo debe ser visible si el turno tiene un comentario o reseña cargado.
● Debe estar bien visible el estado del turno.
● Solamente mostrar la acción que puede realizar el usuario.

● Turnos
○ Solo tendrá acceso el Administrador y le mostrará los turnos de la clínica.
○ Esta sección deberá contar con un filtro único donde podrá filtrar por:
■ Especialidad
■ Especialista
■ NO UTILIZAR Combobox
○ A su vez desde este listado podrá realizar las siguientes acciones:
■ Cancelar turno
● Solamente debe ser visible si el turno no fue Aceptado, Realizado o
Rechazado.
● Para cancelar el turno se debe dejar un comentario del porque se cancela el
mismo.

● Solicitar Turno
○ En esta sección tendrán acceso tanto el Paciente como el Administrador y permitirá realizar
la carga de un turno.
○ Se deberá seleccionar:
■ Especialidad
■ Especialista
■ Día y horario del turno.
■ El paciente debe tener la posibilidad de elegir turno dentro de los próximos 15 días.
■ Estas fechas tienen que estar relacionadas al especialista seleccionado y su
disponibilidad horaria.
○ NO UTILIZAR Datepicker.
○ En el caso del administrador, deberá marcar el Paciente.

4

● Mi perfil
○ Debe contar con los datos del usuario. Nombre, Apellido, Imágenes, etc.
○ Mis horarios
■ Solamente los usuario con perfil Especialista
■ En esta sección el Especialista deberá marcar su disponibilidad horaria. Tener en
cuenta que el Especialista puede tener más de una especialidad asociada.

Sprint 3
● Requerimientos mínimos:
○ Debemos permitir descargar, al menos una de estas dos opciones:
■ En la sección usuarios, solamente para el perfil Administrador, un excel con los datos
de los usuarios.
■ En Mi perfil, para los usuarios paciente, un pdf con la historia clínica. El PDF tiene que
tener logo de la clínica, título del informe y fecha de emisión.

○ Se debe agregar al menos 2 animaciones de transición entre componentes al navegar la
aplicación.

Para esta entrega necesitamos incorporar una historia clínica para cada paciente, donde guardemos todas
las atenciones y controles que se le hizo al paciente. La misma debe ser visible desde:

● Mi Perfil, para los Pacientes.
● Sección Usuarios, para los Administradores.
● Sección Pacientes, para los especialistas. Solo deberá mostrar los usuarios que el especialista
haya atendido al menos 1 vez.
La historia clínica deberá ser cargada por el Especialista una vez que finalice la atención del Paciente. La
misma estará compuesta por:
● Cuatro datos fijos
○ Altura
○ Peso
○ Temperatura
○ Presión
● Máximo tres datos dinámicos. Ingresando clave y valor.
○ Por ejemplo:
■ clave: caries
■ valor: 4

También necesitamos mejorar el filtro de turnos, dando la posibilidad de buscar por cualquier campo del
turno, incluyendo la historia clínica (sean los datos fijos o los dinámicos). Esta nueva funcionalidad deberá
estar en la sección Mis turnos, tanto para los Especialistas como para los Pacientes.

5

Sprint 4
● Requerimientos mínimos:
○ El sistema debe contar con al menos:
■ 3 Pipes.
■ 3 Directivas.

Para esta entrega necesitamos incorporar gráficos y estadísticas para los usuarios Administrador de
nuestro sistema.
● Los informes que necesitamos son:
○ Log de ingresos al sistema. Indicando el usuario, día y horario que ingreso al sistema.
○ Cantidad de turnos por especialidad.
○ Cantidad de turnos por día.
○ Cantidad de turnos solicitado por médico en un lapso de tiempo.
○ Cantidad de turnos finalizados por médico en un lapso de tiempo.
● Necesitamos que estos gráficos e informes se puedan descargar en Excel o Pdf.

Sprint 5
● Nuevos datos dinámicos
En la historia clínica necesitamos agregar 3 nuevos datos dinámicos que el especialista se encargará
de llenar. Estos 3 datos tienen que ser con tres tipos de controles específicos:
● Un control de rango entre 0 y 100.
● Un cuadro de texto numérico.
● Switch con “Si” o “No”.

● Generar una directiva que sea el captcha propio
○ Utilizar el capcha creado por ustedes y que se comunique por Input o outPut de ser necesario
con el que componente que lo contenga
○ Utilizar este captcha en toda operación de alta que realice el paciente y el profesional.
Debemos contar con la opción de deshabilitar el captcha.

● Animaciones de transición
○ Se debe aplicar al menos 6 (seis como mínimo) animación es de transición entre
componentes al navegar la aplicación.

6

Sprint 6
● Idiomas
○ Para esta entrega necesitamos que nuestro sistema tenga la posibilidad de estar en distintos
idiomas.
○ Estos idiomas son:
■ Inglés
■ Español
■ Portugues
○ Como mínimo tenemos que traducir 3 pantallas del sistema.
● Encuesta de Atención
○ Debemos contar con datos de un mínimo de 30 días, con acciones hechas por médicos y
pacientes para poder ver resultados en las estadísticas.
○ Debemos darle al paciente la posibilidad de completar una encuesta de satisfacción con al menos
5 controles. Esta encuesta nos servirá para evaluar la atención de nuestros profesionales y debe
tener:
■ SOLO UN cuadro de texto
■ Estrellas para calificar
■ Radio button
■ Check box
■ Control de rango, etc

● Generar informes en gráficos estadísticos
○ Debemos sumar los siguientes informes:
■ Cantidad de visitas que tuvo la clínica.
■ Cantidad de pacientes por especialidad.
■ Cantidad de médicos por especialidad.
■ Informe basado en la encuesta al cliente mostrando cuáles fueron las respuestas.
● Informe por cantidad de visitas.
● Se ingresa selecciona un paciente y se muestran todos los turnos.(los tomados ,
los suspendidos , los pendientes , etc.)
● Cantidad de pacientes por especialidad ( con posibilidad de descargar la imagen
del gráfico)
● Cantidad de médicos por especialidad ( con posibilidad de descargar la imagen del
gráfico)

FIN CONSIGNAS
Respetar los sprints que voy indicando que hay que hacer. 
Se esta realizando una base de datos y storage de Supabase, por lo que se deberan dar las instrucciones para crear las tablas e insertar los datos que sean necesarios de forma que corra ok en Supabase.
SCSS:
se usara la siguiente paleta de colores:
.first-color { 
	background: #fbfbfb; 
}
	
.second-color { 
	background: #b9e1dc; 
}

.third-color { 
	background: #f38181; 
}

.fourth-color { 
	background: #756c83; 
}
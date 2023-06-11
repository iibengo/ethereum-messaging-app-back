# Memoria de la practica: Contrato de Mensajería Pública

## Introducción

En esta practica, hemos desarrollado un contrato inteligente llamado "PublicMessaging" utilizando el lenguaje de programación Solidity y el framework Hardhat. El contrato permite a los usuarios escribir mensajes públicos, crear perfiles de usuario y leer los mensajes enviados por otros usuarios. Además, el contrato incluye funciones para marcar mensajes como leídos, eliminar mensajes y transferir el saldo acumulado al propietario del contrato.

En esta memoria del proyecto, explicaremos las decisiones clave que hemos tomado durante el desarrollo, la estructura del contrato, las funciones implementadas y las posibles mejoras.

El objetivo principal de este proyecto es proporcionar una plataforma de mensajería básica en la cadena de bloques, donde los usuarios puedan interactuar y comunicarse de forma transparente y segura. El contrato se diseñó teniendo en cuenta la simplicidad y la eficiencia en términos de costos de gas y seguridad.

## Elección del Lenguaje y Framework

El proyecto utiliza el framework Hardhat, que proporciona una base sólida para el desarrollo, pruebas y despliegue de contratos inteligentes en Ethereum. También se utilizan algunas dependencias adicionales para las pruebas y la interacción con la cadena de bloques.

## Estructura del Proyecto

El proyecto sigue una estructura organizada para facilitar su desarrollo y mantenimiento. A continuación se describen los componentes principales:

- **contracts**: Esta carpeta contiene el contrato inteligente `PublicMessaging.sol` que implementa la lógica del sistema de mensajería pública.
- **node_modules**: Aquí se encuentran las dependencias del proyecto, incluyendo el contrato `console.sol` proporcionado por Hardhat.
- **test**: En esta carpeta se encuentran las pruebas unitarias para el contrato `PublicMessaging.sol`.
- **hardhat.config.js**: Archivo de configuración de Hardhat que define la red de desarrollo, las cuentas de prueba y otras opciones relacionadas con el entorno de desarrollo.

### Dependencias Utilizadas

El proyecto utiliza las siguientes dependencias:

- `hardhat`: Framework de desarrollo de Ethereum que facilita la compilación, despliegue y pruebas de contratos inteligentes.
- `ethers`: Biblioteca para interactuar con contratos inteligentes de Ethereum desde JavaScript o TypeScript.
- `chai`: Biblioteca de aserciones utilizada para escribir pruebas más legibles y expresivas.
- `solidity-coverage`: Plugin de Hardhat que permite medir la cobertura de código de los tests.

Estas dependencias son fundamentales para el desarrollo del proyecto y se encargan de proporcionar las herramientas necesarias para compilar, desplegar y probar el contrato `PublicMessaging.sol`.

## Estructura del Contrato

El contrato principal contiene estructuras de datos para los modelos de usuario y mensaje, así como las principales funciones para interactuar con el contrato.

### Estructuras de Datos

1. `UserModel`: Representa un modelo de usuario que incluye el nombre del usuario, su estado de activación y la fecha de creación.
2. `MessageModel`: Representa un modelo de mensaje que incluye el ID del mensaje, su contenido, la dirección del remitente y la fecha de creación.
3. `MessageUserModel`: Combina un modelo de mensaje y un modelo de usuario en una sola estructura.

### Variables y Mapeos

1. `owner`: Almacena la dirección del propietario del contrato.
2. `balance`: Almacena el saldo actual del contrato.
3. `totalMessages`: Contador para realizar un seguimiento del número total de mensajes escritos en el sistema.
4. `fee`: Representa la tarifa requerida para crear un nuevo usuario.
5. `userListByAddressMap`: Un mapeo que asocia una dirección de Ethereum con un modelo de usuario.
6. `messageListByIdMap`: Un mapeo que asocia un ID de mensaje con un modelo de mensaje.
7. `lastReadMessageIdByUserAddressMap`: Un mapeo que almacena el último ID de mensaje leído por cada dirección de usuario.

### Eventos

El contrato define tres eventos:

1. `MessageSent`: Se emite cuando se escribe un nuevo mensaje en el sistema.
2. `UserCreated`: Se emite cuando se crea un nuevo usuario.
3. `BalanceWithdrawn`: Se emite cuando el propietario retira el saldo del contrato.
4. `MessageDeleted`: Se emite cuando se elimina un mensaje.

### Funciones Principales

El contrato proporciona las siguientes funciones principales:

1. `constructor`: Se sete el owner con la dirección del deployer del contrato.
2. `writeMessage`: Permite a un usuario escribir un nuevo mensaje en el sistema. Verifica la longitud del contenido del mensaje y lo almacena en el mapeo `messageListByIdMap`. Además, emite el evento `MessageSent`.
3. `createUser`: Permite a un usuario crear un nuevo perfil en el sistema de mensajería. Requiere que se pague una tarifa (`fee`) y verifica si el nombre del usuario no está vacío. Almacena el perfil del usuario en el mapeo `userListByAddressMap` y emite el evento `UserCreated`.
4. `getUserUnreadMessageCount`: Devuelve el número de mensajes no leídos para el usuario que llama a la función.
5. `getMessageUserModelMap`: Una función interna que se utiliza para obtener un array de `MessageUserModel` (combinación de mensajes y usuarios) dentro de un rango dado de mensajes.
6. `getAllMessages`: Devuelve todos los mensajes almacenados en el sistema como un array de `MessageUserModel`.
7. `getUserUnreadMessages`: Devuelve los mensajes no leídos para el usuario que llama a la función como un array de `MessageUserModel`.
8. `markUserMessagesAsRead`: Marca todos los mensajes del usuario que llama a la función como leídos.
9. `deleteMessage`: Permite al remitente o al propietario del contrato eliminar un mensaje específico.
10. `withdrawBalance`: Permite al propietario del contrato retirarel saldo disponible en el contrato.
11. `disableUser`: Permite al propietario desactivar o activar un usuario existente cambiando su estado activo. 10. `setFee`: Permite al propietario cambiar la tarifa requerida para crear un nuevo usuario.
12. `setFee`: Cambia la tarifa requerida para crear un nuevo usuario.

### Modificadores

El contrato utiliza dos modificadores:

1. `onlyActiveUser`: Verifica si el remitente de la transacción es un usuario registrado y está activo.
2. `onlyOwner`: Verifica si el remitente de la transacción es el propietario del contrato.

## Aspectos de Seguridad

Durante el desarrollo del contrato `PublicMessaging`, se han considerado los siguientes aspectos de seguridad:

- **Longitud del mensaje**: La función `writeMessage` verifica que el contenido del mensaje no supere los 300 caracteres para evitar un consumo excesivo de gas.
- **Validación de entrada**: Se realizan comprobaciones de validación en varias funciones para garantizar que los datos proporcionados sean válidos. Por ejemplo, en la función `createUser` se verifica que el nombre no esté vacío y que el usuario no exista previamente.
- **Privacidad de datos**: Los mapeos que almacenan los usuarios y los mensajes se definen como `private`, lo que significa que solo pueden acceder a ellos las funciones dentro del contrato.
- **Control de acceso**: Se utilizan modificadores como `onlyActiveUser` y `onlyOwner` para restringir el acceso a ciertas funciones solo a los usuarios autorizados o al propietario del contrato.
- **Eventos emitidos**: Se emiten eventos para informar sobre acciones importantes como el envío de un mensaje, la creación de un usuario, la eliminación de un mensaje y la retirada de saldo. Esto permite a los usuarios y a otras aplicaciones obtener información en tiempo real sobre los cambios en el contrato.
- **Retirada segura de saldo**: La función `withdrawBalance` verifica que haya saldo disponible antes de transferirlo al propietario. Además, se registra un evento para auditar la retirada de saldo.

## Puntos de Mejora

Durante el desarrollo del contrato PublicMessaging, se han considerado las siguientes mejoras:

- **Uso de librerias seguras**: Se pueden implementar mejoras adicionales en términos de seguridad para garantizar que las operaciones solo puedan ser realizadas por usuarios autorizados. Esto podría incluir la implementación de un sistema de roles más complejo o la utilización de estándares de seguridad como OpenZeppelin.

- **Analisis de seguridad**: Se pueden auditar el contraro con herramintas personalizadas como `slither`, para buscar vulnerabilidades en el contrato y mejorar la seguridad.

- **Optimización del Uso de Memoria**: El contrato actual almacena todos los mensajes y usuarios en mapeos en memoria. A medida que aumenta el número de mensajes y usuarios, esto puede llevar a un aumento en el consumo de gas y retrasos en la ejecución de las funciones. Una posible mejora sería utilizar estructuras de datos más eficientes, como árboles de Merkle o almacenamiento en capas, para optimizar el uso de memoria.

- **Funcionalidad de Edición de Mensajes**: Actualmente, los mensajes no se pueden editar una vez que se han escrito. Implementar la capacidad de editar mensajes existentes podría ser una mejora útil, especialmente en situaciones donde los usuarios necesiten corregir errores o actualizar información en los mensajes.

- **Funcionalidades de pago**: Se pueden añadir mas funcionalidades, como cambiar nombre, o editar mensaje que podrian conllevar un costo adicional.

- **Interfaz de Usuario y Despliegue Web**: Como parte del desarrollo de este contrato, sería beneficioso desarrollar una interfaz de usuario (UI) amigable para que los usuarios interactúen con el contrato de manera más intuitiva. Además, se podría

considerar desplegar el contrato y la interfaz de usuario en una aplicación web para facilitar el acceso y la adopción del sistema de mensajería.

## Pruebas Unitarias

El contrato `PublicMessaging` ha sido sometido a pruebas unitarias para garantizar su correcto funcionamiento y su comportamiento esperado en diferentes escenarios. Se han utilizado las bibliotecas `ethers` y `chai` para escribir las pruebas y la herramienta `solidity-coverage` para medir la cobertura de código de las pruebas.

Las pruebas unitarias abarcan casos de prueba que verifican la creación de usuarios, el envío de mensajes, la lectura de mensajes no leídos, la eliminación de mensajes, la marcación de mensajes como leídos, la desactivación de usuarios, la retirada de saldo y otros casos de prueba relevantes.

Las pruebas unitarias son fundamentales para garantizar la funcionalidad correcta del contrato y para detectar posibles errores o vulnerabilidades. Al utilizar pruebas unitarias, se aumenta la confianza en la robustez y seguridad del contrato.

## Conclusiones

Este contrato proporciona funcionalidades básicas para un sistema de mensajería pública en la cadena de bloques Ethereum. A través de la estructura del contrato, los usuarios pueden escribir mensajes, crear perfiles de usuario y leer mensajes en un entorno seguro y transparente.

Se han tomado decisiones de diseño considerando la privacidad de los datos, la seguridad y la sostenibilidad del sistema. Sin embargo, existen áreas para mejorar, como la optimización del uso de memoria, la implementación de funcionalidades adicionales y el desarrollo de una interfaz de usuario intuitiva.

En general, este contrato de mensajería pública proporciona una base sólida para futuros desarrollos y mejoras, y puede ser una herramienta útil para implementar sistemas de comunicación descentralizados y transparentes en la cadena de bloques Ethereum.

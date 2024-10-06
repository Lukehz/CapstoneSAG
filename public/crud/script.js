// Al cargar la página, puedes cargar una tabla por defecto si lo deseas
document.addEventListener("DOMContentLoaded", () => loadItems('parcelacion')); // Cambia a la tabla por defecto

let nameTable = 'parcelacion'; // Valor predeterminado

// Función para manejar la visualización de la imagen en un modal
function viewImage(itemId) {
    const imageUrl = `/get-image?id=${itemId}`; // Construye la URL para obtener la imagen
    const modalImage = document.getElementById('modalImage');
    if (modalImage) { // Verifica que el elemento existe
        modalImage.src = imageUrl; // Asigna la URL de la imagen al modal
        document.getElementById('imageModal').style.display = 'block'; // Muestra el modal
    } else {
        console.error('El elemento modalImage no se encuentra en el DOM.');
    }
}

// Función para cerrar el modal
function closeModalImg() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = 'none'; // Oculta el modal
    }
}

// Cargar ítems según la tabla seleccionada
async function loadItems(Table) {
    const crudTitle = document.getElementById('crud-title');
    const addButton = document.getElementById('addButton');
    nameTable = Table;
    console.log(nameTable);
    addButton.style.display = 'block';
    // Cambiar el título y el botón según la tabla
    if (nameTable === 'parcelacion') {
        crudTitle.textContent = 'Gestión de Parcelaciones';
        addButton.textContent = 'Agregar Parcelación';
        addButton.onclick = () => openModal('parcelacion');
    } else if (nameTable === 'region') {
        crudTitle.textContent = 'Gestión de Regiones';
        addButton.textContent = 'Agregar Región';
        addButton.onclick = () => openModal('region');
    } else if (nameTable === 'provincia') {
        crudTitle.textContent = 'Gestión de Provincia';
        addButton.textContent = 'Agregar provincia';
        addButton.onclick = () => openModal('provincia');
    } else if (nameTable === 'sector') {
        crudTitle.textContent = 'Gestión de Sector';
        addButton.textContent = 'Agregar Sector';
        addButton.onclick = () => openModal('sector');
    } else if (nameTable === 'cuarentena') {
        crudTitle.textContent = 'Gestión de Cuarentena';
        addButton.textContent = 'Agregar Cuarentena';
        addButton.onclick = () => openModal('cuarentena');
    } else if (nameTable === 'cultivo') {
        crudTitle.textContent = 'Gestión de Cultivo';
        addButton.textContent = 'Agregar Cultivo';
        addButton.onclick = () => openModal('cultivo');
    } else if (nameTable === 'fase') {
        crudTitle.textContent = 'Gestión de Fase';
        addButton.textContent = 'Agregar Fase';
        addButton.onclick = () => openModal('fase');
    } else if (nameTable === 'usuario') {
        crudTitle.textContent = 'Gestión de Usurio';
        addButton.textContent = 'Agregar Usuario';
        addButton.onclick = () => openModal('usuario');
    } else if (nameTable === 'historial') {
        crudTitle.textContent = 'Gestión de Historial';
        addButton.style.display = 'none';
        //addButton.textContent = 'Agregar Historial';
        //addButton.onclick = () => openModal('historial');
    }
    
    try {
        const response = await fetch(`/api/read/${nameTable}`); // Usa el endpoint adecuado
        if (!response.ok) {
            throw new Error('Error al cargar los datos');
        }
        const items = await response.json();

        const itemList = document.getElementById('itemList');
        const tableHeaders = document.getElementById('tableHeaders');

        // Limpiar contenido previo
        itemList.innerHTML = '';
        tableHeaders.innerHTML = '';

        if (items.length > 0) {
            // Definir encabezados según los datos
            const headers = Object.keys(items[0]); // Obtener claves del primer objeto
            headers.forEach((header, index) => {
                const th = document.createElement('th');
                th.textContent = header.charAt(0).toUpperCase() + header.slice(1); // Capitalizar
                tableHeaders.appendChild(th);
                if (nameTable === 'parcelacion') {
                // Si estamos en la tercera columna, añadimos el encabezado de "Imagen" después
                if (index === 2) {
                    const thImagen = document.createElement('th');
                    thImagen.textContent = 'Imagen';
                    tableHeaders.appendChild(thImagen);
                }}
            });
            
            if (nameTable !== 'historial') {
            // Agregar el encabezado de "Acciones" al final
            const thAcciones = document.createElement('th');
            thAcciones.textContent = 'Acciones';
            tableHeaders.appendChild(thAcciones);
            }
            // Poblamos las filas
            items.forEach(item => {
                const row = document.createElement('tr');
                headers.forEach((header, index) => {
                    const td = document.createElement('td');
                    td.textContent = item[header]; // Asignar valor del item
                    row.appendChild(td);
                    if (nameTable === 'parcelacion') {
                    // Si estamos en la tercera columna, añadimos la celda de imagen después
                    if (index === 2) {
                        const imagenTd = document.createElement('td');
                        const verImagenBtn = document.createElement('button');
                        verImagenBtn.textContent = 'Ver Imagen';
                        verImagenBtn.onclick = () => viewImage(item.id); // Llamar a la función viewImage
                        imagenTd.appendChild(verImagenBtn);
                        row.appendChild(imagenTd);
                    }
                }});
                if (nameTable !== 'historial') {
                const actionsTd = document.createElement('td');
                actionsTd.innerHTML = `
                    <button onclick="editItem(${item.id})">Editar</button>
                    <button onclick="deleteItem(${item.id})">Eliminar</button>
                `;
                row.appendChild(actionsTd);
                }
                itemList.appendChild(row);
            });
        }        
    } catch (error) {
        console.error('Error al cargar los ítems:', error);
    }
}

function openModal(nameTable, item = null) {
    const modal = document.getElementById('myModal');
    const title = document.getElementById('modalTitle');
    const formFields = document.getElementById('formFields');
    const crudTitle = document.getElementById('crud-title');

    // Limpiar campos previos
    formFields.innerHTML = '';

    if (nameTable === 'parcelacion') {
        title.textContent = item ? 'Editar Parcelación' : 'Agregar Parcelación';
        
        loadOptions(nameTable);
    // Llenar opciones dinámicamente
    
        // Campos para Parcelación
        formFields.innerHTML = `
            <input type="hidden" id="itemId"> <!-- Campo oculto para el ID -->
            <input type="number" id="latitud" placeholder="Latitud" step="any" min="-90" max="90" required>
            <input type="number" id="longitud" placeholder="Longitud" step="any" min="-180" max="180" required>
            <input type="file" name="image" accept="image/*" id="image">
            <select name="id_sector" id="id_sector" required>
                <option value="">Seleccione un Sector</option>
                <!-- Opciones dinámicas -->
            </select>
            <select name="id_fase" id="id_fase" required>
                <option value="">Seleccione una Fase</option>
                <!-- Opciones dinámicas -->
            </select>
            <select name="id_cultivo" id="id_cultivo" required>
                <option value="">Seleccione un Cultivo</option>
                <!-- Opciones dinámicas -->
            </select>
            <select name="registrada" id="registrada" required>
                <option value="">Seleccione si está registrada</option>
                <option value="0">No Registrada</option>
                <option value="1">Registrada</option>
            </select>
        `;
    } else if (nameTable === 'region') {
        title.textContent = item ? 'Editar Región' : 'Agregar Región';
        
        // Campos para Región
        formFields.innerHTML = `
            <input type="hidden" id="itemId"> <!-- Campo oculto para el ID -->
            <input type="text" id="numero" placeholder="Número" name="numero" required>
            <input type="text" id="nombre" placeholder="Nombre" name="nombre" required>
        `;
    } else if (nameTable === 'provincia') {
        title.textContent = item ? 'Editar Provincia' : 'Agregar Provincia';
        loadOptionsRegion();
        // Campos para Provincia
        formFields.innerHTML = `
            <input type="hidden" id="itemId"> <!-- Campo oculto para el ID -->
            <select name="id_region" id="id_region" required>
                <option value="">Seleccione una Region</option>
                <!-- Opciones dinámicas -->
            </select>
            <input type="text" id="nombre" placeholder="Nombre" name="nombre" required>
        `;
    } else if (nameTable === 'sector') {
        title.textContent = item ? 'Editar Sector' : 'Agregar Sector';
        loadOptionsSector();
        // Campos para Sector
        formFields.innerHTML = `
            <input type="hidden" id="itemId"> <!-- Campo oculto para el ID -->
            <select name="id_provincia" id="id_provincia" required>
                <option value="">Seleccione una Provincia</option>
                <!-- Opciones dinámicas -->
            </select>
            <input type="text" id="comuna" placeholder="Comuna" name="comuna" required>
        `;
    } else if (nameTable === 'cuarentena') {
        title.textContent = item ? 'Editar Cuarentena' : 'Agregar Cuarentena';
        loadOptions(nameTable);
        // Campos para Cuarentena
        formFields.innerHTML = `
            <input type="hidden" id="itemId"> <!-- Campo oculto para el ID -->
            <select name="id_sector" id="id_sector" required>
                <option value="">Seleccione una Sector</option>
                <!-- Opciones dinámicas -->
            </select>
            <input type="number" id="latitud" placeholder="Latitud" step="any" min="-90" max="90" required>
            <input type="number" id="longitud" placeholder="Longitud" step="any" min="-180" max="180" required>
            <input type="number" id="radio" placeholder="Radio (Opcional)" name="radio" step="any">
            <input type="text" id="comentario" placeholder="Motivo" name="comentario" required>
        `;
    } else if (nameTable === 'cultivo') {
        title.textContent = item ? 'Editar Cultivo' : 'Agregar Cultivo';
        
        // Campos para Región
        formFields.innerHTML = `
            <input type="hidden" id="itemId"> <!-- Campo oculto para el ID -->
            <input type="text" id="nombre" placeholder="Nombre Cultivo" name="nombre" required>
        `;
    } else if (nameTable === 'fase') {
        title.textContent = item ? 'Editar Fase' : 'Agregar Fase';
        
        // Campos para Fase
        formFields.innerHTML = `
            <input type="hidden" id="itemId"> <!-- Campo oculto para el ID -->
            <input type="text" id="nombre" placeholder="Nombre Fase" name="nombre" required>
        `;
    } else if (nameTable === 'usuario') {
        title.textContent = item ? 'Editar Usuario' : 'Agregar Usuario';
        
        // Campos para Usuario
        formFields.innerHTML = `
            <input type="hidden" id="itemId"> <!-- Campo oculto para el ID -->
            <input type="text" id="nombre" placeholder="Nombre" name="nombre" required>
            <input type="text" id="apellido" placeholder="Apellido" name="apellido" required>
            <input type="email" id="correo" placeholder="Correo Electrónico" name="correo" required>
            <input type="number" id="rut" placeholder="RUT" name="rut" required>
            <input type="text" id="dv_rut" placeholder="Dígito Verificador" name="dv_rut" required pattern="^[0-9Kk]$" title="Ingrese un dígito o 'K'">
            <select name="rol" id="rol" required>
                <option value="">Seleccione rol</option>
                <option value="Admin">Administrador</option>
                <option value="User">Usuario</option>
            </select>
            <input type="text" id="usuario" placeholder="Nombre de usuario" name="usuario" required>
            <input type="password" id="password" placeholder="Password" name="password" required> <!-- CON ESTA LINEA DA UNA ADVERTENSIA DE ItemId duplicado, Pero solo con esta linea -->
        `;
    }
    
    // Si hay un item, llenar el formulario con los datos
    if (item) {
        console.log('openModal:', item); // Verificación del ID.
        // Verifica si la tabla es parcelacion y si el item tiene la propiedad id_parcelacion
        if (nameTable === 'parcelacion') {
            document.getElementById('itemId').value = item.id_parcelacion; // Ajustar según el ID
            console.log('ID del ítem:', document.getElementById('itemId').value); // Verificación del ID

            document.getElementById('latitud').value = item.latitud;
            document.getElementById('longitud').value = item.longitud;

            setTimeout(() => {
                document.getElementById('id_sector').value = item.id_sector || '';
                document.getElementById('id_fase').value = item.id_fase || '';
                document.getElementById('id_cultivo').value = item.id_cultivo || '';
            }, 1250); // Retardo para asegurarse de que las opciones se hayan cargado

            const registradaSelect = document.getElementById('registrada');
            registradaSelect.value = item.registrada ? '1' : '0'; 
        } else if (nameTable === 'region') {
            document.getElementById('itemId').value = item.id_region; // Ajustar según el ID
            console.log('ID del ítem:', document.getElementById('itemId').value); // Verificación del ID

            document.getElementById('nombre').value = item.nombre;
            document.getElementById('numero').value = item.numero;

        } else if (nameTable === 'provincia') {
            document.getElementById('itemId').value = item.id_provincia; // Ajustar según el ID
            console.log('ID del ítem:', document.getElementById('itemId').value); // Verificación del ID
            setTimeout(() => {
            document.getElementById('id_region').value = item.id_region;
            }, 400); // Retardo para asegurarse de que las opciones se hayan cargado
            document.getElementById('nombre').value = item.nombre;

        } else if (nameTable === 'sector') {
            document.getElementById('itemId').value = item.id_sector; // Ajustar según el ID
            console.log('ID del ítem:', document.getElementById('itemId').value); // Verificación del ID
            setTimeout(() => {
            document.getElementById('id_provincia').value = item.id_provincia;
            }, 400); // Retardo para asegurarse de que las opciones se hayan cargado
            document.getElementById('comuna').value = item.comuna;

        } else if (nameTable === 'cuarentena') {
            document.getElementById('itemId').value = item.id_cuarentena; // Ajustar según el ID
            console.log('ID del ítem:', document.getElementById('itemId').value); // Verificación del ID
            setTimeout(() => {
            document.getElementById('id_sector').value = item.id_sector;
            }, 1000); // Retardo para asegurarse de que las opciones se hayan cargado
            document.getElementById('latitud').value = item.latitud;
            document.getElementById('longitud').value = item.longitud;
            document.getElementById('radio').value = item.radio;
            document.getElementById('comentario').value = item.comentario;

        } else if (nameTable === 'cultivo') {
            document.getElementById('itemId').value = item.id_cultivo; // Ajustar según el ID
            console.log('ID del ítem:', document.getElementById('itemId').value); // Verificación del ID

            document.getElementById('nombre').value = item.nombre;

        } else if (nameTable === 'fase') {
            document.getElementById('itemId').value = item.id_fase; // Ajustar según el ID
            console.log('ID del ítem:', document.getElementById('itemId').value); // Verificación del ID

            document.getElementById('nombre').value = item.nombre;

        } else if (nameTable === 'usuario') {
            document.getElementById('itemId').value = item.id_usuario; // Ajustar según el ID
            console.log('ID del ítem:', document.getElementById('itemId').value); // Verificación del ID

            document.getElementById('correo').value = item.correo;
            document.getElementById('password').value = item.password;
            document.getElementById('usuario').value = item.usuario;
            document.getElementById('rut').value = item.rut;
            document.getElementById('dv_rut').value = item.dv_rut;
            document.getElementById('nombre').value = item.nombre;
            document.getElementById('apellido').value = item.apellido;
            document.getElementById('rol').value = item.rol;


        }
    }

    modal.style.display = 'block'; // Mostrar modal
}

function closeModal() {
    const modal = document.getElementById('myModal');
    modal.style.display = "none"; // O usa clases CSS para ocultar el modal

    // Reiniciar el formulario
    document.getElementById('itemForm').reset();
    document.getElementById('itemId').value = ''; // Asegúrate de resetear el ID también
}
//////////////////////////////
function editItem(id) {
    console.log(nameTable);
    console.log(id);
    fetch(`/api/readEdit/${nameTable}/${id}`)
        .then(response => {
            if (!response.ok) throw new Error('Error al obtener el ítem');
            return response.json();

        })
        .then(item => {
            console.log(item, 'item'); // Ver los datos obtenidos
            
            // Abre el modal con los datos del ítem
            document.getElementById('modalTitle').innerText = `Editar ${nameTable}`;
            document.getElementById('submitButton').innerText = 'Confirmar Cambios';
            openModal(nameTable, item); // Pasa el objeto item
        })
        .catch(error => console.error('Error:', error));
}


async function deleteItem(id) {
    const confirmation = confirm('¿Estás seguro de que deseas eliminar este ítem?');
    if (confirmation) {
        try {
            const response = await fetch(`/api/delete/${nameTable}/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert('Ítem eliminado con éxito.');
                loadItems(nameTable); // Recargar la lista de ítems después de eliminar
            } else {
                throw new Error('Error al eliminar el ítem');
            }
        } catch (error) {
            console.error('Error al eliminar el ítem:', error);
            alert('No se pudo eliminar el ítem.');
        }
    }
}

// Función para validar campos
function validarCampos(formData) {
    for (const [key, value] of formData.entries()) {
        if (value.trim() === '') {
            alert(`Los campos no pueden estar vacios.`);
            return false;
        }
    }
    return true;
}


document.getElementById('itemForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    trimInputFields(); // Limpia los campos

    if (nameTable === 'usuario') {
    // Obtener los valores de RUT y dígito verificador
    const rutInput = document.getElementById('rut').value;
    const dvInput = document.getElementById('dv_rut').value;

        // Validar el RUT
        if (!validarRUT(rutInput, dvInput)) {
            alert('El dígito verificador del RUT es incorrecto.');
            return; // Salir de la función si la validación falla
        }
    }
    const id = document.getElementById('itemId').value;
    console.log('ID:', id);
    const formData = new FormData();
    
        // Verifica si se están obteniendo los valores
        //const nombre = document.getElementById('nombre').value;
        //const numero = document.getElementById('numero').value;
    
        //console.log('Nombreeeee:', nombre); // Deberías ver el valor aquí
        //console.log('Númerooooo:', numero); // Deberías ver el valor aquí


    // Agregar campos comunes
    if (nameTable === 'parcelacion') {
        formData.append('latitud', document.getElementById('latitud').value);
        formData.append('longitud', document.getElementById('longitud').value);
        formData.append('id_sector', document.getElementById('id_sector').value);
        formData.append('id_fase', document.getElementById('id_fase').value);
        formData.append('id_cultivo', document.getElementById('id_cultivo').value);
        formData.append('registrada', document.getElementById('registrada').value);
        const imageFile = document.getElementById('image').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }
    } else if (nameTable === 'region') {
        formData.append('numero', document.getElementById('numero').value);
        formData.append('nombre', document.getElementById('nombre').value);
    } else if (nameTable === 'provincia') {
        formData.append('id_region', document.getElementById('id_region').value);
        formData.append('nombre', document.getElementById('nombre').value);
    } else if (nameTable === 'sector') {
        formData.append('id_provincia', document.getElementById('id_provincia').value);
        formData.append('comuna', document.getElementById('comuna').value);
    } else if (nameTable === 'cuarentena') {
        formData.append('latitud', document.getElementById('latitud').value);
        formData.append('longitud', document.getElementById('longitud').value);
        formData.append('id_sector', document.getElementById('id_sector').value);
        const radio = document.getElementById('radio').value;
        const radioValue = radio === '' ? null : Number(radio);
        formData.append('radio', radioValue);
        formData.append('comentario', document.getElementById('comentario').value);
    } else if (nameTable === 'cultivo') {
        formData.append('nombre', document.getElementById('nombre').value);
    } else if (nameTable === 'fase') {
        formData.append('nombre', document.getElementById('nombre').value);
    } else if (nameTable === 'usuario') {
        formData.append('correo', document.getElementById('correo').value);
        formData.append('usuario', document.getElementById('usuario').value);
        formData.append('password', document.getElementById('password').value);
        formData.append('rut', document.getElementById('rut').value);
        formData.append('dv_rut', document.getElementById('dv_rut').value);
        formData.append('nombre', document.getElementById('nombre').value);
        formData.append('apellido', document.getElementById('apellido').value);
        formData.append('rol', document.getElementById('rol').value);
    }

    // Validar los campos antes de enviar
    if (!validarCampos(formData)) {
        return; // Salir si hay un campo vacío
    }

    try {
        let response;
        if (id) {
            console.log('zzz:', id);
            for (const [key, value] of formData.entries()) {
                console.log(`Key: ${key}, Value: ${value}`);
            }
            // Actualizar ítem existente
            response = await fetch(`/api/edit/${nameTable}/${id}`, {
                method: 'PUT',
                body: formData // Envía el FormData directamente
            }
            
        )
        loadItems(nameTable);
        ;

            if (!response.ok) {
                throw new Error('Error al actualizar el ítem');
            }
        } else {
            // Crear nuevo ítem
            console.log(nameTable);
            for (const [key, value] of formData.entries()) {
                console.log(`Key: ${key}, Value: ${value}`);
            }
            response = await fetch(`/api/create/${nameTable}`, {
                method: 'POST',
                body: formData // Envía el FormData directamente
            });

            if (!response.ok) {
                throw new Error('Error al crear el ítem');
            }
        }

        // Reiniciar el formulario y recargar los ítems
        document.getElementById('itemForm').reset();
        closeModal(); // Cerrar el modal
        await loadItems(nameTable); // Recargar ítems

    } catch (error) {
        console.error('Error:', error);
    }
});

async function loadOptions(nameTable) {
    try {
        const response = await fetch('/opciones');
        const data = await response.json();
        console.log(data)

        // Llenar el dropdown de sectores para ambas PARCELACIONES Y CUARENTENA
        // Llenar el dropdown de sectores
        const sectorSelect = document.getElementById('id_sector');
        data.sectores.forEach(sector => {
            const option = document.createElement('option');
            option.value = sector.id_sector;
            option.textContent = sector.sector;
            sectorSelect.appendChild(option);
        });

        // Si nameTable es 'parcelacion', llenar los dropdowns de fases y cultivos
        if (nameTable === 'parcelacion') {
        // Llenar el dropdown de fases
        const faseSelect = document.getElementById('id_fase');
        data.fases.forEach(fase => {
            const option = document.createElement('option');
            option.value = fase.id_fase;
            option.textContent = fase.nombre;
            faseSelect.appendChild(option);
        });

        // Llenar el dropdown de cultivos
        const cultivoSelect = document.getElementById('id_cultivo');
        data.cultivos.forEach(cultivo => {
            const option = document.createElement('option');
            option.value = cultivo.id_cultivo;
            option.textContent = cultivo.nombre;
            cultivoSelect.appendChild(option);
        });
    }
    } catch (error) {
        console.error('Error al cargar las opciones:', error);
    }
}

async function loadOptionsRegion() {
    try {
        const response = await fetch('/api/read/region');
        const data = await response.json();
        console.log('data region opciones: ',data)
        // Llenar el dropdown de sectores
        const sectorSelect = document.getElementById('id_region');
        data.forEach(result => {
            const option = document.createElement('option');
            option.value = result.id;
            option.textContent = result.nombre;
            sectorSelect.appendChild(option);
        })
    } catch (error) {
        console.error('Error al cargar de la region:', error);
    }};

async function loadOptionsSector() {
    try {
        const response = await fetch('/opciones/sector');
        const data = await response.json();
        console.log('data Region y provincia opciones: ',data)
        // Llenar el dropdown de sectores
        const sectorSelect = document.getElementById('id_provincia');
        data.forEach(result => {
            const option = document.createElement('option');
            option.value = result.id_provincia;
            option.textContent = result.provincia;
            sectorSelect.appendChild(option);
        })
    } catch (error) {
        console.error('Error al cargar de la region:', error);
    }};

function validarRUT(rut, dvIngresado) {
    const rutNumerico = parseInt(rut.replace(/\./g, ''), 10); // Asegúrate de que el RUT sea un número

    // Calcular el dígito verificador
    let suma = 0;
    let multiplicador = 2;

    for (let i = rutNumerico; i > 0; i = Math.floor(i / 10)) {
        suma += (i % 10) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1; // Alternar entre 2 y 7
    }

    const dvCalculado = 11 - (suma % 11);
    const dvFinal = dvCalculado === 11 ? '0' : dvCalculado === 10 ? 'K' : dvCalculado.toString();

    return dvFinal.toUpperCase() === dvIngresado.toUpperCase(); // Comparar con el ingresado
}

function trimInputFields() {
    const fieldsToTrim = Array.from(document.querySelectorAll('#itemForm input[type="text"], #itemForm input[type="email"], #itemForm input[type="password"]'));
    console.log(fieldsToTrim);
    return fieldsToTrim.map(field => {
        field.value = field.value.trim(); // Elimina espacios al inicio y al final
        return field; // Retorna el campo para la validación
    });
}
    
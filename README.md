# Catálogo de Hardware

Catálogo web educativo de productos, cables, conectores y estándares de hardware desarrollado utilizando GitHub y Supabase.

## Descripción

Este proyecto permite visualizar y organizar diferentes productos de hardware mediante una interfaz gráfica de catálogo.

Cada producto puede incluir:

- Nombre
- Categoría
- Marca
- Capacidad
- Modelo
- Especificación
- Imagen mediante URL externa
- URL de la fuente oficial

El catálogo incluye ejemplos de cables, conectores, dispositivos USB y otros componentes relacionados con los objetivos de hardware de CompTIA.

## Funciones

- Catálogo público de productos.
- Búsqueda de productos.
- Filtrado por categoría.
- Imágenes cargadas mediante URLs externas.
- Enlaces a las fuentes de los productos.
- Inicio de sesión de administrador mediante Supabase Authentication.
- Agregar productos individualmente.
- Importar varios productos mediante el importador.
- Eliminar productos como administrador.
- Protección de la base de datos mediante Row Level Security (RLS).

## Tecnologías utilizadas

- HTML
- CSS
- JavaScript
- GitHub
- Supabase

## Base de datos

La información de los productos se almacena en Supabase. La tabla principal contiene los campos necesarios para mostrar la información del catálogo.

El catálogo puede ser consultado públicamente, mientras que las operaciones administrativas están restringidas a un usuario autorizado.
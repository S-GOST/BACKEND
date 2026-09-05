# Usar la imagen oficial de Node.js (versión 20 ligera)
FROM node:20-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiar package.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código de la aplicación
COPY . .

# Generar el cliente de Prisma
RUN npx prisma generate

# Exponer el puerto de la aplicación (el mismo que en tu .env)
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]

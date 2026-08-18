FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps
RUN npm install ogl gsap jspdf jspdf-autotable --legacy-peer-deps

COPY . .

EXPOSE 3000

CMD ["npm","start"]
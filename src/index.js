const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
app.set('port', process.env.PORT || 3443);

// Middleware para parsear JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});


app.get('/reservas', (req, res) => {
  const archivoPath = path.join(__dirname, 'reservas.json');
  fs.readFile(archivoPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error leyendo reservas:', err);
      return res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
    try {
      const reservas = JSON.parse(data);
      res.status(200).json(reservas);
    } catch (e) {
      console.error('JSON corrupto:', e);
      res.status(500).json({ mensaje: 'Error al procesar las reservas' });
    }
  });
});

app.post('/reservas', (req, res) => {
  const { nombre, email, telefono, motivo, hora } = req.body;

  if (!nombre || !email || !telefono || !motivo || !hora) {
    return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });
  }

  const nuevaReserva = { nombre, email, telefono, motivo, hora };
  const archivoPath = path.join(__dirname, 'src', 'reservas.json');

  fs.readFile(archivoPath, 'utf8', (err, data) => {
    let reservas = [];

    if (!err) {
      try {
        reservas = JSON.parse(data);
      } catch (e) {
        console.error('Error al parsear JSON existente, se usará arreglo vacío:', e);
      }
    }

    reservas.push(nuevaReserva);

    fs.writeFile(archivoPath, JSON.stringify(reservas, null, 2), (err) => {
      if (err) {
        console.error('Error al guardar la reserva:', err);
        return res.status(500).json({ mensaje: 'No se pudo guardar la reserva' });
      }

      console.log('✅ Reserva guardada:', nuevaReserva);
      res.status(201).json({ mensaje: 'Reserva guardada con éxito' });
    });
  });
});


app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

const sslServer = https.createServer(
  {
    key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem')),
  },
  app
);

sslServer.listen(app.get('port'), () =>
  console.log(`✅ Servidor HTTPS corriendo en https://localhost:${app.get('port')}`)
);





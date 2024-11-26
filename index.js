const express = require("express");
const mongoose = require("mongoose");
const moment = require("moment");

const app = express();
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/Agencia"); 

const clienteSchema = new mongoose.Schema({
    nombre: String,
    apellido: String,
    direccion: String,
    telefono: String,
    email: String,
    ultimaVisita: { type: Date, default: null },
});

const vehiculoSchema = new mongoose.Schema({
    marca: String,
    modelo: String,
    anio: Number,
    color: String,
    placa: String,
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: "Cliente" },
});

const servicioSchema = new mongoose.Schema({
    tipo: String,
    fecha: Date,
    hora: String,
    costo: Number,
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: "Cliente" },
});

const ofertaSchema = new mongoose.Schema({
    tipo: String,
    fecha: Date,
    hora: String,
    costo: Number,
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: "Cliente" },
    expiracion: Date,
});

const Cliente = mongoose.model("Cliente", clienteSchema);
const Vehiculo = mongoose.model("Vehiculo", vehiculoSchema);
const Servicio = mongoose.model("Servicio", servicioSchema);
const Oferta = mongoose.model("Oferta", ofertaSchema);

app.get("/clientes", async (req, res) => {
    const clientes = await Cliente.find();
    res.json(clientes);
});

app.get("/vehiculos", async (req, res) => {
    const vehiculos = await Vehiculo.find();
    res.json(vehiculos);
});

app.get("/servicios", async (req, res) => {
    const servicios = await Servicio.find();
    res.json(servicios);
});

app.get("/ofertas", async (req, res) => {
    const ofertas = await Oferta.find();
    res.json(ofertas);
});

app.post("/clientes", async (req, res) => {
    const cliente = new Cliente(req.body);
    await cliente.save();
    res.json(cliente);
});

app.post("/vehiculos", async (req, res) => {
    const vehiculo = new Vehiculo(req.body);
    await vehiculo.save();
    res.json(vehiculo);
});

app.post("/servicios", async (req, res) => {
    const servicio = new Servicio(req.body);
    await servicio.save();
    res.json(servicio);
});

app.post("/ofertas", async (req, res) => {
    const oferta = new Oferta({
        ...req.body,
        expiracion: moment(req.body.fecha).add(3, "months").toDate(),
    });
    await oferta.save();
    res.json(oferta);
});

app.put("/clientes/:id", async (req, res) => {
    const cliente = await Cliente.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });
    res.json(cliente);
});

app.put("/vehiculos/:id", async (req, res) => {
    const vehiculo = await Vehiculo.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });
    res.json(vehiculo);
});

app.put("/servicios/:id", async (req, res) => {
    const servicio = await Servicio.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });
    res.json(servicio);
});

app.put("/ofertas/:id", async (req, res) => {
    const oferta = await Oferta.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });
    res.json(oferta);
});

app.get("/revisar-clientes", async (req, res) => {
    const hoy = moment();
    const clientes = await Cliente.find();

    const resultados = await Promise.all(
        clientes.map(async (cliente) => {
            if (cliente.ultimaVisita) {
                const mesesInactivo = hoy.diff(moment(cliente.ultimaVisita), "months");

                if (mesesInactivo > 10) {
                    await Cliente.findByIdAndDelete(cliente._id);
                    return { cliente, status: "Eliminado por inactividad de más de 10 meses" };
                } else if (mesesInactivo > 6) {
                    const nuevaOferta = new Oferta({
                        tipo: "Descuento por inactividad",
                        fecha: hoy.toDate(),
                        hora: "12:00",
                        costo: 0,
                        clienteId: cliente._id,
                        expiracion: hoy.add(3, "months").toDate(),
                    });
                    await nuevaOferta.save();
                    return { cliente, status: "Oferta creada por inactividad de más de 6 meses" };
                }
            }
            return { cliente, status: "Activo" };
        })
    );

    res.json(resultados);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

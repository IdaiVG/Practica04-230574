import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';
import macaddress from 'macaddress';

const app = express();
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server iniciado en http://localhost:${PORT}`);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessions = {};
app.use(
    session({
        secret: "P4-IDVG-TacosDePastor-SessionesHTTP-VariablesdeSesion",
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 5 * 60 * 1000 }
    })
);

const getLocalIp = () => {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];
        for (const iface of interfaces) {
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    return null; 
};

const getClientIP= () => {
    return macaddress.oneSync(); 
};


app.get('/', (req, res) => {
    return res.status(200).json({
        message: 'Bienvendi@ a la API de Control de Sesiones',
        author: 'Guadalupe Idai Vargas Galindo'
    });
});

app.post('/login', (req, res) => {
    const {email, nickname, macAddress} = req.body;
    if (!email || !nickname || !macAddress) {
        return res.status(400).json({
            message: 'Se esperan campos requeridos'
        });
    }
    const sessionID = uuidv4();
    const now = new Date();

    session[sessionID] = {
        sessionID,
        email,
        nickname,
        macAddress,
        ip: getClientIP(req),
        createdAt: now,
        lastAccessed: now,
        serverIp: getLocalIp(),
    };
    res.status(200).json({
        message: 'Se ha logueado de manera exitosa',
        sessionID,
    });
});

app.post("/logout", (req, res) => {
    const { sessionID } = req.body;

    if (!sessionID || !sessions[sessionID]) {
        return res.status(404).json({
            message: 'No se han encontrado sesiones activas'
        });
    }

    delete sessions[sessionID];
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                message: 'Error al cerrar sesión'
            });
        }
    });

    res.status(200).json({
        message: 'Logout exitoso'
    });
});

app.post("/update", (req, res) => {
    const {sessionID} = req.body;

    if (!sessionID || !sessions[sessionID]) {
        return res.status(404).json({
            message: 'No existe una sesión activa'
        });
    }
    sessions[sessionID].lastAccessed = new Date();

    res.send({
        message: 'Datos actualizados',
        session: Request.session.user
    });
});


app.get("/status", (req, res) => {
    const sessionID = req.query.sessionID;

    if (!sessionID || !sessions[sessionID]) {
        return res.status(404).json({
            message: 'No existe una sesión activa'
        });
    }

    const session = sessions[sessionID];
    const now = new Date();
    const idleTime = (now - new Date(session.lastAccessed)) / 1000;
    const duration = (now - new Date(session.createdAt)) / 1000; 

    res.status(200).json({
        message: 'Sesión activa',
        session,
        idleTime: `${idleTime} segundos`,
        duration: `${duration} segundos`
    });
});

app.get('/sessionactiva', (req, res) => {
  res.status(200).json({
        message: 'Sesiones activas',
        sessions
    });
});

//setInterval(() => {
  //  const now = new Date();
    //for (const sessionID in sessions) {
      //  const session = sessions[sessionID];
        //const idleTime = (now - new Date(session.lastAccessed)) / 1000; 
        //if (idleTime > 120) { // 2 minutos
          //  delete sessions[sessionID];
        //}
    //}
//}, 60000);

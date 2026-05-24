const express=require("express");
const path=require("path");
const fs=require("fs").promises;

const app=express();
const PORT=4000;
const DB_PATH=path.join(__dirname, "db", "projects.json");
const MSG_PATH=path.join(__dirname, "db", "messages.json");
const SITE_PATH=path.join(__dirname, "db", "site.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, ".")));

// Admin Credentials (hardcoded for simplicity as requested)
const ADMIN_USER="admin";
const ADMIN_PASS="12345";

const BOT_TOKEN="8386006626:AAHw3V1BzjETgGI11OH_4imfslfz_r5BTSY";
const CHAT_ID="554103742";

// Helper to read DB
async function readDB(path) {
    try {
        const data=await fs.readFile(path, "utf8");
        return JSON.parse(data);
    }

    catch (error) {
        return [];
    }
}

// Helper to write DB
async function writeDB(path, data) {
    await fs.writeFile(path, JSON.stringify(data, null, 2));
}

app.get("/", (req, res)=> {
        res.sendFile(path.join(__dirname, "index.html"));
    }

);

// Admin Login
app.post("/api/login", (req, res)=> {
        const {
            username, password
        }

        =req.body;

        if (username===ADMIN_USER && password===ADMIN_PASS) {
            res.json( {
                    ok: true, token: "fake-jwt-token-isa-dev"
                }

            );
        }

        else {
            res.status(401).json( {
                    ok: false, error: "Username yoki parol noto'g'ri"
                }

            );
        }
    }

);

// Get Projects
app.get("/api/projects", async (req, res)=> {
        const projects=await readDB(DB_PATH);
        res.json(projects);
    }

);

// Add Project
app.post("/api/projects", async (req, res)=> {
        const newProject=req.body;
        const projects=await readDB(DB_PATH);
        newProject.id=Date.now(); // Simple ID generation
        projects.push(newProject);
        await writeDB(DB_PATH, projects);

        res.json( {
                ok: true, project: newProject
            }

        );
    }

);

// Update Project
app.put("/api/projects/:id", async (req, res)=> {
        const id=parseInt(req.params.id);
        const updatedData=req.body;
        let projects=await readDB(DB_PATH);
        const index=projects.findIndex(p=> p.id===id);

        if (index !==-1) {
            projects[index]= {
                ...projects[index], ...updatedData
            }

            ;
            await writeDB(DB_PATH, projects);

            res.json( {
                    ok: true, project: projects[index]
                }

            );
        }

        else {
            res.status(404).json( {
                    ok: false, error: "Project not found"
                }

            );
        }
    }

);

// Delete Project
app.delete("/api/projects/:id", async (req, res)=> {
        const id=parseInt(req.params.id);
        let projects=await readDB(DB_PATH);
        projects=projects.filter(p=> p.id !==id);
        await writeDB(DB_PATH, projects);

        res.json( {
                ok: true
            }

        );
    }

);

// Get Messages
app.get("/api/messages", async (req, res)=> {
        const messages=await readDB(MSG_PATH);
        res.json(messages);
    }

);

// Get full site data (testimonials, certificates, contact)
app.get('/api/site', async (req, res)=> {
        try {
            const site=await readDB(SITE_PATH);

            // If file missing or empty, return default object
            if ( !site || Object.keys(site).length===0) {
                return res.json( {

                        testimonials: [],
                        certificates: [],
                        contact: {}
                    }

                );
            }

            res.json(site);
        }

        catch (err) {
            res.status(500).json( {
                    ok: false, error: 'Failed to read site data'
                }

            );
        }
    }

);

// Replace full site data
app.put('/api/site', async (req, res)=> {
        try {
            const payload=req.body || {}

            ;
            await writeDB(SITE_PATH, payload);

            res.json( {
                    ok: true
                }

            );
        }

        catch (err) {
            console.error('Failed to write site data', err);

            res.status(500).json( {
                    ok: false, error: 'Failed to save site data'
                }

            );
        }
    }

);

// Delete Message
app.delete("/api/messages/:date", async (req, res)=> {
        const date=decodeURIComponent(req.params.date);
        let messages=await readDB(MSG_PATH);
        messages=messages.filter(m=> m.date !==date);
        await writeDB(MSG_PATH, messages);

        res.json( {
                ok: true
            }

        );
    }

);

app.post("/send", async (req, res)=> {
        const {
            name, email, phone, subject
        }

        =req.body;

        if ( !name || !email || !phone || !subject) {
            return res.status(400).json( {
                    ok: false, error: "Barcha maydonlar to'ldirilishi kerak"
                }

            );
        }

        // Save to local DB
        const messages=await readDB(MSG_PATH);

        const newMessage= {
            id: Date.now(), name, email, phone, subject, date: new Date().toISOString()
        }

        ;
        messages.push(newMessage);
        await writeDB(MSG_PATH, messages);

        const text=`📩 Yangi xabar:\n` + `👤 Ism: $ {
            name
        }

        \n` + `📧 Email: $ {
            email
        }

        \n` + `📱 Telefon: $ {
            phone
        }

        \n` + `📝 Mavzu: $ {
            subject
        }

        `;

        const url=`https: //api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

        try {
            const response=await fetch(url, {

                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    }

                    ,
                    body: JSON.stringify( {
                            chat_id: CHAT_ID, text
                        }

                    )
                }

            );

            const data=await response.json();

            if (data.ok) {
                res.json( {
                        ok: true, message: "Xabar yuborildi!"
                    }

                );
            }

            else {
                console.error("Telegram API xatosi:", data);

                res.status(500).json( {
                        ok: false, error: "Telegram xatosi"
                    }

                );
            }
        }

        catch (err) {
            console.error("Fetch xatosi:", err);

            res.status(500).json( {
                    ok: false, error: "Xabar yuborilmadi"
                }

            );
        }
    }

);

app.listen(PORT, ()=> {
        console.log(`Server http: //localhost:${PORT} da ishlamoqda!`);
        }

    );
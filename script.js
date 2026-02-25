// Utilisation d'un objet {} pour mieux gérer les quantités par plat
let cart = {}; 

const texts = ["Karibu, Tsuguwa Ye plat Yaho","Bienvenue, Choisi ton plat", "Welcome, Choose your meal"];
let i = 0;
setInterval(() => {
    document.getElementById("welcome-text").textContent = texts[i];
    i = (i + 1) % texts.length;
}, 3000);

// Nouvelle fonction ajouter (gère les quantités)
function addToCart(name, price) {
    if (cart[name]) {
        cart[name].qty += 1;
    } else {
        cart[name] = { price: price, qty: 1 };
    }
    updateUI();
}

function updateUI() {
    let count = 0;
    let total = 0;
    for (let id in cart) {
        count += cart[id].qty;
        total += (cart[id].price * cart[id].qty);
    }
    document.getElementById("items-count").textContent = `${count} plat(s) (Voir détail 🛒)`;
    document.getElementById("total-price").textContent = `${total} KMF`;
    if(document.getElementById("modal-total")) {
        document.getElementById("modal-total").textContent = `${total} KMF`;
    }
}

// Ouvrir/Fermer la modale
function toggleModal() {
    const modal = document.getElementById("cart-modal");
    modal.style.display = (modal.style.display === "block") ? "none" : "block";
    if (modal.style.display === "block") renderCartDetails();
}

// Afficher la liste modifiable
function renderCartDetails() {
    const list = document.getElementById("cart-details-list");
    list.innerHTML = "";
    
    for (let name in cart) {
        const item = cart[name];
        list.innerHTML += `
            <div class="cart-item-detail">
                <div><strong>${name}</strong><br><small>${item.price} KMF</small></div>
                <div>
                    <button class="qty-btn" onclick="updateQty('${name}', -1)">-</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" onclick="updateQty('${name}', 1)">+</button>
                </div>
            </div>`;
    }
    if (Object.keys(cart).length === 0) list.innerHTML = "Votre panier est vide.";
}

function updateQty(name, change) {
    cart[name].qty += change;
    if (cart[name].qty <= 0) delete cart[name];
    updateUI();
    renderCartDetails();
}

function clearCart() {
    cart = {};
    updateUI();
    toggleModal();
}

function sendWhatsAppOrder() {
    // 1. Vérifier si le panier est vide (méthode pour un Objet)
    const itemsKeys = Object.keys(cart);
    if (itemsKeys.length === 0) {
        alert("Votre panier est vide !");
        return;
    }
    
    // 2. Générer le code de suivi
    const orderID = "CMD-" + Math.floor(100 + Math.random() * 900);
    
    let message = `*Numéro de suivi : ${orderID}*\n\nBonjour ! Je souhaite commander :\n`;
    let total = 0;

    // 3. Boucle correcte pour un Objet
    itemsKeys.forEach(name => {
        const item = cart[name];
        const subtotal = item.price * item.qty;
        message += `- ${item.qty}x ${name} (${subtotal} KMF)\n`;
        total += subtotal;
    });
    
    message += `\n*Total à payer : ${total} KMF*`;

    // ... (haut de la fonction identique)

    const phone = "2693999585"; 
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    // Tentative d'enregistrement Firebase
    database.ref('orders/' + orderID).set({
        status: "Commande reçue ⏳",
        total: total,
        date: new Date().toLocaleString(),
        items: cart
    })
    .then(() => {
        // SUR MOBILE : On informe l'utilisateur puis on redirige
        alert("Commande enregistrée ! Code : " + orderID);
        
        // Utiliser location.href est souvent plus efficace sur mobile que window.open
        window.location.href = whatsappUrl; 
    })
    .catch((error) => {
        console.error("Erreur Firebase :", error);
        // Si Firebase échoue, on ouvre quand même WhatsApp pour ne pas perdre la vente
        window.location.href = whatsappUrl;
    });
}
function checkStatus() {
    const code = document.getElementById("orderCode").value.toUpperCase().trim();
    const res = document.getElementById("statusResult");

    if (!code) {
        res.innerHTML = "Veuillez entrer un code (ex: CMD-123)";
        return;
    }

    // On écoute Firebase en temps réel
    database.ref('orders/' + code).on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            res.innerHTML = `Statut de la commande ${code} : <br><strong style="color:var(--primary)">${data.status}</strong>`;
        } else {
            res.innerHTML = "❌ Code introuvable. Vérifiez l'orthographe.";
        }
    });

}


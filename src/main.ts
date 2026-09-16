import "./style.css";
import { createSimulatedScan, jitterScan, type NearbyDevice } from "./proximity";

const appRoot = document.querySelector<HTMLDivElement>("#app");

if (!appRoot) {
  throw new Error("Missing #app root");
}

const root = appRoot;

let devices: NearbyDevice[] = createSimulatedScan();

function render() {
  root.innerHTML = `
    <main class="app">
      <p class="eyebrow">Web preview</p>
      <h1>Pulseras nearby</h1>
      <p class="lede">
        This MVP uses a simulated Bluetooth/proximity source so the experience
        can be previewed in the browser and later wrapped for Android.
      </p>
      <section class="panel">
        <div class="status">
          <div>
            <strong>Scanning</strong>
            <div class="meta">${devices.length} nearby bracelets</div>
          </div>
          <span class="pill">simulated BLE</span>
        </div>
        ${devices
          .map(
            (device) => `
              <article class="device">
                <div>
                  <strong>${device.name}</strong>
                  <div class="meta">RSSI ${device.rssi} dBm</div>
                </div>
                <div class="distance">${device.meters.toFixed(1)} m</div>
              </article>
            `,
          )
          .join("")}
      </section>
      <p class="hint">
        Native BLE scanning is not required for this preview. Capacitor can wrap
        the same Vite build when you are ready to ship Android.
      </p>
    </main>
  `;
}

render();
window.setInterval(() => {
  devices = jitterScan(devices);
  render();
}, 1400);

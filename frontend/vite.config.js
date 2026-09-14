  // Import Vite's configuration helper.
  import { defineConfig } from "vite";

  // Configure the Vite development server.
  export default defineConfig({
    server: {
      proxy: {
        // Forward every /api request to the Spring Boot backend.
        "/api": {
          target: "http://localhost:8080",
          changeOrigin: true
        }
      }
    }
  });

//    import { defineConfig } from "vite";
//
//      export default defineConfig({
//        server: {
//          proxy: {
//            "/api": {
//              target: "http://localhost:8080",
//              changeOrigin: true
//            }
//          }
//        }
//      });
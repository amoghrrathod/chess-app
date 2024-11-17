import React, { useEffect } from "react";
import k from "./kaplayCtx";
import disclaimer from "./scenes/disclaimer";
import game from "./scenes/game";
import gameover from "./scenes/gameover";
import mainMenu from "./scenes/mainMenu";

function SonicGame() {
  useEffect(() => {
    // Initialize Kaplay.js and load assets
    k.loadSprite("chemical-bg", "/graphics/chemical-bg.png");
    k.loadSprite("platforms", "/graphics/platforms.png");
    k.loadSprite("sonic", "/graphics/sonic.png", {
      sliceX: 8,
      sliceY: 2,
      anims: {
        run: { from: 0, to: 7, loop: true, speed: 30 },
        jump: { from: 8, to: 15, loop: true, speed: 100 },
      },
    });
    k.loadSprite("ring", "/graphics/ring.png", {
      sliceX: 16,
      sliceY: 1,
      anims: {
        spin: { from: 0, to: 15, loop: true, speed: 30 },
      },
    });
    k.loadSprite("motobug", "/graphics/motobug.png", {
      sliceX: 5,
      sliceY: 1,
      anims: {
        run: { from: 0, to: 4, loop: true, speed: 8 },
      },
    });
    k.loadFont("mania", "/fonts/mania.ttf");
    k.loadSound("destroy", "/sounds/Destroy.wav");
    k.loadSound("hurt", "/sounds/Hurt.wav");
    k.loadSound("hyper-ring", "/sounds/HyperRing.wav");
    k.loadSound("jump", "/sounds/Jump.wav");
    k.loadSound("ring", "/sounds/Ring.wav");
    k.loadSound("city", "/sounds/city.mp3");

    // Define scenes
    k.scene("disclaimer", disclaimer);
    k.scene("main-menu", mainMenu);
    k.scene("game", game);
    k.scene("gameover", gameover);

    // Start the game
    k.go("disclaimer");

    // Cleanup
    return () => {
      // Remove the canvas element
      const canvas = document.querySelector("canvas");
      if (canvas) {
        canvas.remove();
      }
    };
  }, []);

  return (
    <div
      id="game-container"
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        overflow: "hidden",
      }}
    ></div>
  );
}

export default SonicGame;

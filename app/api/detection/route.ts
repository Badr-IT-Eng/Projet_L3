import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Cette API permet d'interagir avec le service de détection Python

// Fonction pour exécuter une commande Python
async function runPythonScript(scriptPath: string, args: string[] = []): Promise<{stdout: string, stderr: string}> {
  return new Promise((resolve, reject) => {
    // Chemin du service de détection
    const detectionServicePath = path.join(process.cwd(), 'detection-service');
    
    // Options pour le processus enfant
    const options = {
      cwd: detectionServicePath,
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    };
    
    // Lancer le script Python avec les arguments
    const process = spawn('python3', [scriptPath, ...args], options);
    
    let stdout = '';
    let stderr = '';
    
    // Collecter la sortie standard
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    // Collecter la sortie d'erreur
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    // Gérer la fin du processus
    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
      }
    });
    
    // Gérer les erreurs
    process.on('error', (err) => {
      reject(err);
    });
  });
}

// GET /api/detection - Vérifier l'état du service de détection
export async function GET(request: NextRequest) {
  try {
    // Obtenir l'état du service en exécutant un script de test
    const { stdout, stderr } = await runPythonScript('test_setup.py');
    
    // Traiter la sortie
    const response = {
      status: 'ok',
      message: 'Service de détection disponible',
      details: {
        stdout: stdout.split('\n'),
        stderr: stderr ? stderr.split('\n') : []
      }
    };
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Erreur lors de la vérification du service de détection:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Le service de détection n\'est pas disponible', 
      error: error.message 
    }, { status: 500 });
  }
}

// POST /api/detection/start - Démarrer le service de détection
export async function POST(request: NextRequest) {
  try {
    // Récupérer les paramètres de la requête
    const data = await request.json();
    const { camera = 0, location = 'Main Entrance', threshold = 0.6 } = data;
    
    // Préparer les arguments pour le script Python
    const args = [
      '--camera', camera.toString(),
      '--location', location,
      '--threshold', threshold.toString()
    ];
    
    // Lancer le service de détection en arrière-plan
    const detectionProcess = spawn('python3', ['start_detection.py', ...args], {
      cwd: path.join(process.cwd(), 'detection-service'),
      detached: true,
      stdio: 'ignore'
    });
    
    // Détacher le processus pour qu'il continue en arrière-plan
    detectionProcess.unref();
    
    return NextResponse.json({ 
      status: 'started', 
      message: 'Service de détection démarré avec succès',
      params: { camera, location, threshold }
    });
  } catch (error: any) {
    console.error('Erreur lors du démarrage du service de détection:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Impossible de démarrer le service de détection', 
      error: error.message 
    }, { status: 500 });
  }
}

// Pour détecter un objet à partir d'une image téléchargée
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Aucune image fournie' 
      }, { status: 400 });
    }
    
    // Sauvegarder l'image temporaire dans le service de détection
    const buffer = Buffer.from(await image.arrayBuffer());
    const tempImagePath = path.join(process.cwd(), 'detection-service', 'temp_image.jpg');
    fs.writeFileSync(tempImagePath, buffer);
    
    // Exécuter la détection sur l'image
    const { stdout } = await runPythonScript('run_detection.py', ['--image', 'temp_image.jpg']);
    
    // Analyser la sortie pour obtenir les détections
    let detections = [];
    try {
      const outputLines = stdout.trim().split('\n');
      // Chercher la ligne qui commence par "DETECTIONS:"
      const detectionLine = outputLines.find(line => line.startsWith('DETECTIONS:'));
      if (detectionLine) {
        const jsonStr = detectionLine.replace('DETECTIONS:', '').trim();
        detections = JSON.parse(jsonStr);
      }
    } catch (e) {
      console.error('Erreur lors de l\'analyse des détections:', e);
    }
    
    // Supprimer le fichier temporaire
    try {
      fs.unlinkSync(tempImagePath);
    } catch (e) {
      console.error('Erreur lors de la suppression de l\'image temporaire:', e);
    }
    
    return NextResponse.json({ 
      status: 'success',
      detections
    });
    
  } catch (error: any) {
    console.error('Erreur lors de la détection d\'objets:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Impossible de traiter la détection d\'objets', 
      error: error.message 
    }, { status: 500 });
  }
}

// DELETE /api/detection/stop - Arrêter le service de détection
export async function DELETE(request: NextRequest) {
  try {
    // Exécuter un script pour arrêter proprement le service de détection
    // Note: Ceci est une implémentation simplifiée. En production, vous voudriez
    // garder une trace du PID du processus de détection pour l'arrêter correctement.
    
    // Sur Linux/Mac, on peut utiliser la commande pkill
    spawn('pkill', ['-f', 'start_detection.py']);
    
    return NextResponse.json({ 
      status: 'stopped', 
      message: 'Service de détection arrêté avec succès'
    });
  } catch (error: any) {
    console.error('Erreur lors de l\'arrêt du service de détection:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Impossible d\'arrêter le service de détection', 
      error: error.message 
    }, { status: 500 });
  }
} 
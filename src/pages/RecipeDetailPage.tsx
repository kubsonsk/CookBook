import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Recipe } from '../types';
import { 
  ArrowLeft, Clock, Users, Edit, Trash2, 
  Share2, Play, ChevronRight, CheckCircle2, ListChecks, Tag
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, formatTime } from '../lib/utils';
import confetti from 'canvas-confetti';

export default function RecipeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(1);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchRecipe = async () => {
      const docRef = doc(db, 'recipes', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Recipe;
        setRecipe(data);
        setServings(data.servings || 1);
      }
      setLoading(false);
    };
    fetchRecipe();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      await deleteDoc(doc(db, 'recipes', id!));
      navigate('/');
    }
  };

  const shareToReminders = async () => {
    if (!recipe) return;
    const scale = servings / (recipe.servings || 1);
    const ingredientList = recipe.ingredients
      .map(i => `- [ ] ${Math.round(i.amount * scale * 100) / 100} ${i.unit} ${i.name}`)
      .join('\n');
    
    const shareData = {
      title: `Shopping List for ${recipe.title}`,
      text: `Ingredients:\n${ingredientList}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(shareData.text);
      alert('Ingredients list copied to clipboard! You can paste it into your Reminders app.');
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!recipe) return <div className="text-center py-20"><p>Recipe not found.</p><Link to="/" className="text-primary-500">Go Home</Link></div>;

  const scale = servings / (recipe.servings || 1);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between -mt-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 dark:text-zinc-400">
          <ArrowLeft size={24} />
        </button>
        <div className="flex gap-2">
          <Link to={`/edit/${id}`} className="p-2 text-slate-600 dark:text-zinc-400">
            <Edit size={22} />
          </Link>
          <button onClick={handleDelete} className="p-2 text-red-500">
            <Trash2 size={22} />
          </button>
        </div>
      </div>

      <div className="relative rounded-3xl overflow-hidden aspect-video shadow-xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 leading-none">
        {recipe.heroImageUrl ? (
          <img 
            src={recipe.heroImageUrl} 
            alt={recipe.title} 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary-100 dark:bg-primary-950 text-primary-500">
            <ChefHat size={64} />
          </div>
        )}
        {recipe.videoUrl && (
          <button 
            onClick={() => setShowVideo(!showVideo)}
            className="absolute inset-0 flex items-center justify-center bg-black/30 group hover:bg-black/40 transition-colors"
          >
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
              <Play className="text-white fill-white ml-1" size={32} />
            </div>
          </button>
        )}
      </div>

      {showVideo && recipe.videoUrl && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="overflow-hidden"
        >
          <iframe
            src={recipe.videoUrl.replace('watch?v=', 'embed/')}
            className="w-full aspect-video rounded-2xl"
            title="Recipe Video"
            allowFullScreen
          />
        </motion.div>
      )}

      <div>
        <h1 className="text-3xl font-black uppercase tracking-tighter leading-tight">{recipe.title}</h1>
        {recipe.labels && recipe.labels.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {recipe.labels.map(l => (
              <span key={l} className="px-3 py-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-full text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
                <Tag size={10} className="text-primary-500" />
                {l}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm">
        <div className="text-center flex-1">
          <Clock className="mx-auto text-primary-500 mb-1" size={20} />
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none">Time</p>
          <p className="font-bold">{recipe.prepTime ? formatTime(recipe.prepTime) : '--'}</p>
        </div>
        <div className="w-px h-8 bg-slate-100 dark:bg-zinc-800" />
        <div className="text-center flex-1">
          <Users className="mx-auto text-primary-500 mb-1" size={20} />
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none">Servings</p>
          <div className="flex items-center justify-center gap-2 mt-0.5">
            <button onClick={() => setServings(Math.max(1, servings - 1))} className="w-5 h-5 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-slate-600">-</button>
            <span className="font-bold min-w-[1ch]">{servings}</span>
            <button onClick={() => setServings(servings + 1)} className="w-5 h-5 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-slate-600">+</button>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            Ingredients
          </h2>
          <button 
            onClick={shareToReminders}
            className="flex items-center gap-1.5 text-xs font-bold text-primary-500 uppercase tracking-widest hover:opacity-80 transition-opacity"
          >
            <ListChecks size={16} />
            Send to Reminders
          </button>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
          {recipe.ingredients.map((ing, i) => (
            <div key={i} className="flex items-center justify-between p-4 border-b border-slate-50 dark:border-zinc-800/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
              <span className="font-medium">{ing.name}</span>
              <span className="font-bold text-primary-500 group-hover:scale-110 transition-transform">
                {Math.round(ing.amount * scale * 100) / 100} <span className="text-[10px] uppercase font-bold ml-0.5">{ing.unit}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-black uppercase tracking-tight">Steps</h2>
        <div className="space-y-4">
          {recipe.steps.map((step, i) => (
            <motion.div 
              key={i}
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 overflow-hidden shadow-sm"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg shadow-primary-500/20">
                    {i + 1}
                  </div>
                  <p className="text-slate-700 dark:text-zinc-300 leading-relaxed font-medium pt-1">
                    {step.text}
                  </p>
                </div>
                {step.imageUrl && (
                  <div className="rounded-2xl overflow-hidden mt-3 border border-slate-100 dark:border-zinc-800 h-40">
                    <img 
                      src={step.imageUrl} 
                      alt={`Step ${i + 1}`} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="pt-6">
        <button 
          onClick={() => {
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#f97316', '#fb923c', '#ffffff']
            });
          }}
          className="w-full py-4 bg-primary-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={24} />
          I'm done cooking!
        </button>
      </div>
    </div>
  );
}

function ChefHat({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M6 13.8V21h12v-7.2" />
      <path d="M6 18h12" />
      <path d="M21 11V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3Z" />
      <path d="M12 5V3" />
      <path d="M9 3h6" />
    </svg>
  );
}

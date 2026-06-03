import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home as HomeIcon, RotateCcw } from 'lucide-react';
import { ArchHeader } from '../components/Ornament.jsx';
import { findTopic, findSubject } from '../theme.js';
import GachaReveal from '../components/GachaReveal.jsx';

export default function LessonComplete() {
  const { topicId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const topic = findTopic(topicId);
  const subject = topic && findSubject(topic.subjectId);
  const { score = 0, totalAttempts = 0, goodCount = 0, hardCount = 0, unlock = null, type = null } = location.state || {};
  const [revealOpen, setRevealOpen] = useState(Boolean(unlock));

  const headline = score >= 80 ? 'Szuper munka!'
                 : score >= 50 ? 'Jó haladás'
                 : 'Még gyakorlunk';

  return (
    <div className="space-y-6 pt-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <ArchHeader title={headline} subtitle={topic?.name} />
      </motion.div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="card text-center py-8"
      >
        <div className="text-7xl font-bold text-primary-700">{score}%</div>
        <div className="text-ink-500 text-sm mt-2">
          {goodCount} biztos válasz · {hardCount} bizonytalan
          {totalAttempts - goodCount - hardCount > 0 && ` · ${totalAttempts - goodCount - hardCount} hiba`}
        </div>
      </motion.div>

      <AnimatePresence>
        {unlock && revealOpen && (
          <GachaReveal result={unlock} onClose={() => setRevealOpen(false)} />
        )}
      </AnimatePresence>

      {unlock && !revealOpen && (
        <button
          onClick={() => setRevealOpen(true)}
          className="btn-secondary w-full"
        >
          Mutasd újra a lovat
        </button>
      )}

      <div className="space-y-2">
        <button
          onClick={() => navigate(type ? `/quiz/${topicId}?type=${type}` : `/topic/${topicId}`, { replace: true })}
          className="btn-secondary w-full"
        >
          <RotateCcw size={18} /> Még egy kör
        </button>
        {subject && (
          <Link to={`/subject/${subject.id}`} className="btn-ghost w-full">
            Vissza: {subject.name}
          </Link>
        )}
        <Link to="/" className="btn-ghost w-full">
          <HomeIcon size={18} /> Főoldal
        </Link>
      </div>
    </div>
  );
}


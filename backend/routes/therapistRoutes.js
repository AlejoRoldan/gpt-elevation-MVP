// backend/routes/therapistRoutes.js
// HU-046 — Therapist role routes

const express = require('express');
const router = express.Router();
const User = require('../User');
const MoodLog = require('../MoodLog');
const SessionRating = require('../SessionRating');

// ==========================================
// GET /api/therapist/pacientes
// Returns all patients assigned to the logged-in therapist
// ==========================================
router.get('/pacientes', async (req, res) => {
  try {
    const therapistId = req.user.id;

    const patients = await User.findAll({
      where: { therapistId, role: 'user' },
      attributes: ['id', 'name', 'email', 'active', 'createdAt'],
    });

    const patientsWithStats = await Promise.all(
      patients.map(async (p) => {
        const moodLogs = await MoodLog.findAll({
          where: { UserId: p.id },
          order: [['date', 'DESC']],
          limit: 30,
        });

        const ratings = await SessionRating.findAll({
          where: { UserId: p.id },
          attributes: ['rating'],
        });

        const lastMood = moodLogs[0] ?? null;

        const allMoods = moodLogs
          .flatMap(m => [m.checkin_mood, m.checkout_mood])
          .filter(Boolean);

        const moodTrend = allMoods.length >= 2
          ? allMoods[0] >= allMoods[1] ? 'up' : 'down'
          : 'neutral';

        const avgRating = ratings.length > 0
          ? Math.round((ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length) * 10) / 10
          : null;

        const sessionsThisWeek = moodLogs.filter(m => {
          const daysDiff = (Date.now() - new Date(m.date).getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff <= 7;
        }).length;

        return {
          id: p.id,
          name: p.name,
          email: p.email,
          active: p.active,
          createdAt: p.createdAt,
          lastMood,
          moodTrend,
          avgRating,
          totalSessions: moodLogs.length,
          sessionsThisWeek,
        };
      })
    );

    res.json(patientsWithStats);
  } catch (error) {
    console.error('❌ Error fetching patients:', error);
    res.status(500).json({ error: 'Could not fetch patients.' });
  }
});

// ==========================================
// GET /api/therapist/pacientes/:id/historial
// Returns mood + rating history for a specific patient
// ==========================================
router.get('/pacientes/:id/historial', async (req, res) => {
  try {
    const therapistId = req.user.id;
    const patientId = req.params.id;

    // Verify the patient belongs to this therapist
    const patient = await User.findOne({
      where: { id: patientId, therapistId, role: 'user' },
      attributes: ['id', 'name', 'email', 'createdAt'],
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found or not assigned to you.' });
    }

    const moodLogs = await MoodLog.findAll({
      where: { UserId: patientId },
      order: [['date', 'DESC']],
      limit: 30,
    });

    const ratings = await SessionRating.findAll({
      where: { UserId: patientId },
      order: [['date', 'DESC']],
      limit: 30,
    });

    res.json({ patient: patient.toJSON(), moodLogs, ratings });
  } catch (error) {
    console.error('❌ Error fetching patient history:', error);
    res.status(500).json({ error: 'Could not fetch patient history.' });
  }
});

module.exports = router;
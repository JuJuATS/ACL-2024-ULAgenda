const connectDB = require('./db');
const Agenda = require('./models/agenda');
const Rdv = require('./models/rdv');

connectDB().then(async () => {
    const nouvelAgenda = new Agenda({
        title: "Agenda test",
        description: "Ceci est un agenda de test."
    });

    const agendaSauvegardee = await nouvelAgenda.save();
    console.log('Agenda enregistré avec succès :', agendaSauvegardee);

    const rdv1 = new Rdv({
        agendaId: agendaSauvegardee._id,
        date: new Date(),
        description: 'Rendez-vous 1 de Test'
    });

    const rdv2 = new Rdv({
        agendaId: agendaSauvegardee._id,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        description: 'Rendez-vous 2 de Test'
    });

    await rdv1.save();
    await rdv2.save();

    console.log('Rendez-vous enregistrés avec succès !');

    const agendas = await Agenda.find().populate('rdvs');
    console.log('Agendas trouvés :', agendas);

    const rdvs = await Rdv.find({ agendaId: agendaSauvegardee._id });
    console.log('Rendez-vous pour l\'agenda :', rdvs);

    mongoose.connection.close();
}).catch(err => {
    console.error('Erreur lors de l\'exécution des tests :', err);
});
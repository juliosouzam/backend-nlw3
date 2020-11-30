import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import Orphanage from '../models/Orphanage';
import orphanagesView from '../views/orphanages_view';
import * as Yup from 'yup';

export default {
  async index(req: Request, res: Response) {
    const orphanagesRespository = getRepository(Orphanage);

    const orphanage = await orphanagesRespository.find({
      relations: ['images'],
    });

    return res.json(orphanagesView.renderMany(orphanage));
  },

  async show(req: Request, res: Response) {
    const { id } = req.params;

    const orphanagesRespository = getRepository(Orphanage);

    const orphanage = await orphanagesRespository.findOneOrFail(id, {
      relations: ['images'],
    });

    return res.json(orphanagesView.render(orphanage));
  },

  async create(req: Request, res: Response) {
    const {
      name,
      latitude,
      longitude,
      about,
      instructions,
      opening_hours,
      open_on_weekends,
    } = req.body;

    const orphanagesRespository = getRepository(Orphanage);

    const requestImages = req.files as Express.Multer.File[];

    const images = requestImages.map((image) => {
      return { path: image.filename };
    });

    const data = {
      name,
      latitude,
      longitude,
      about,
      instructions,
      opening_hours,
      open_on_weekends: open_on_weekends === 'true',
      images,
    };

    const schema = Yup.object().shape({
      name: Yup.string().required(),
      latitude: Yup.number().required(),
      longitude: Yup.number().required(),
      about: Yup.string().required().max(300),
      instructions: Yup.string().required(),
      opening_hours: Yup.string().required(),
      open_on_weekends: Yup.boolean().required(),
      images: Yup.array(
        Yup.object().shape({
          path: Yup.string().required(),
        })
      ),
    });

    await schema.validate(data, {
      abortEarly: false,
    });

    const orphanage = orphanagesRespository.create(data);

    await orphanagesRespository.save(orphanage);

    return res.status(201).json(orphanage);
  },
};

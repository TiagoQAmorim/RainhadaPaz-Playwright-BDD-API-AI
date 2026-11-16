import type { PrismaClient } from "@prisma/client";
import siteBundle from "@/data/site-bundle.json";
import { syncSaintCatalogToDb } from "@/lib/saints-catalog";

type Bundle = typeof siteBundle;

/** Conteúdo completo migrado do ambiente local (rifas, velas, posts, etc.). */
export async function importSiteBundle(prisma: PrismaClient): Promise<void> {
  const bundle = siteBundle as Bundle;
  if (!bundle.siteSettings) return;

  await syncSaintCatalogToDb(prisma);

  const s = bundle.siteSettings;
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {
      parishName: s.parishName,
      diocese: s.diocese,
      address: s.address,
      phone: s.phone,
      email: s.email,
      whatsapp: s.whatsapp,
      heroTitle: s.heroTitle,
      heroSubtitle: s.heroSubtitle,
      aboutHtml: s.aboutHtml,
      massScheduleHtml: s.massScheduleHtml,
      pixKey: s.pixKey,
      instagramUrl: s.instagramUrl,
      youtubeUrl: s.youtubeUrl,
      facebookUrl: s.facebookUrl,
      logoUrl: s.logoUrl,
      heroImageUrl: s.heroImageUrl,
      heroImageUrl2: s.heroImageUrl2,
      heroImageUrl3: s.heroImageUrl3,
      matrizImageUrl: s.matrizImageUrl,
      capelaImageUrl: s.capelaImageUrl,
      youtubeChannelUrl: s.youtubeChannelUrl,
      tercoOnlineSchedule: s.tercoOnlineSchedule,
      tercoOnlineLink: s.tercoOnlineLink,
      candleDurationAmount: s.candleDurationAmount,
      candleDurationUnit: s.candleDurationUnit,
      candlesNotifyEmail: s.candlesNotifyEmail,
      candleAccessMode: s.candleAccessMode,
      candlePriceCents: s.candlePriceCents,
      candlePaymentPix: s.candlePaymentPix,
      candlePaymentSicredi: s.candlePaymentSicredi,
      maintenanceEnabled: s.maintenanceEnabled,
      maintenanceMessage: s.maintenanceMessage,
      maintenanceEndsAt: s.maintenanceEndsAt ? new Date(s.maintenanceEndsAt) : null,
    },
    create: {
      id: 1,
      parishName: s.parishName,
      diocese: s.diocese,
      address: s.address,
      phone: s.phone,
      email: s.email,
      whatsapp: s.whatsapp,
      heroTitle: s.heroTitle,
      heroSubtitle: s.heroSubtitle,
      aboutHtml: s.aboutHtml,
      massScheduleHtml: s.massScheduleHtml,
      pixKey: s.pixKey,
      instagramUrl: s.instagramUrl,
      youtubeUrl: s.youtubeUrl,
      facebookUrl: s.facebookUrl,
      logoUrl: s.logoUrl,
      heroImageUrl: s.heroImageUrl,
      heroImageUrl2: s.heroImageUrl2,
      heroImageUrl3: s.heroImageUrl3,
      matrizImageUrl: s.matrizImageUrl,
      capelaImageUrl: s.capelaImageUrl,
      youtubeChannelUrl: s.youtubeChannelUrl,
      tercoOnlineSchedule: s.tercoOnlineSchedule,
      tercoOnlineLink: s.tercoOnlineLink,
      candleDurationAmount: s.candleDurationAmount,
      candleDurationUnit: s.candleDurationUnit,
      candlesNotifyEmail: s.candlesNotifyEmail,
      candleAccessMode: s.candleAccessMode,
      candlePriceCents: s.candlePriceCents,
      candlePaymentPix: s.candlePaymentPix,
      candlePaymentSicredi: s.candlePaymentSicredi,
      maintenanceEnabled: s.maintenanceEnabled,
      maintenanceMessage: s.maintenanceMessage,
      maintenanceEndsAt: s.maintenanceEndsAt ? new Date(s.maintenanceEndsAt) : null,
    },
  });

  for (const page of bundle.pages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: { title: page.title, body: page.body, featuredImage: page.featuredImage },
      create: {
        slug: page.slug,
        title: page.title,
        body: page.body,
        featuredImage: page.featuredImage,
      },
    });
  }

  for (const post of bundle.posts as Bundle["posts"]) {
    const { galleryImages, youtubeVideos, ...data } = post;
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {
        title: data.title,
        excerpt: data.excerpt,
        body: data.body,
        coverImage: data.coverImage,
        published: data.published,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        featuredOnHomeCarousel: data.featuredOnHomeCarousel,
      },
      create: {
        id: data.id,
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        body: data.body,
        coverImage: data.coverImage,
        published: data.published,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        featuredOnHomeCarousel: data.featuredOnHomeCarousel,
      },
    });
    await prisma.postGalleryImage.deleteMany({ where: { postId: post.id } });
    for (const img of galleryImages as Array<{
      id: string;
      imageUrl: string;
      caption: string | null;
      sortOrder: number;
    }>) {
      await prisma.postGalleryImage.create({
        data: {
          id: img.id,
          postId: post.id,
          imageUrl: img.imageUrl,
          caption: img.caption,
          sortOrder: img.sortOrder,
        },
      });
    }
    await prisma.postYoutubeVideo.deleteMany({ where: { postId: post.id } });
    for (const v of youtubeVideos as Array<{
      id: string;
      youtubeVideoId: string;
      title: string | null;
      sortOrder: number;
    }>) {
      await prisma.postYoutubeVideo.create({
        data: {
          id: v.id,
          postId: post.id,
          youtubeVideoId: v.youtubeVideoId,
          title: v.title,
          sortOrder: v.sortOrder,
        },
      });
    }
  }

  for (const notice of bundle.notices) {
    await prisma.notice.upsert({
      where: { id: notice.id },
      update: {
        title: notice.title,
        body: notice.body,
        coverImage: notice.coverImage,
        published: notice.published,
        publishedAt: notice.publishedAt ? new Date(notice.publishedAt) : null,
        expiresAt: notice.expiresAt ? new Date(notice.expiresAt) : null,
      },
      create: {
        id: notice.id,
        title: notice.title,
        body: notice.body,
        coverImage: notice.coverImage,
        published: notice.published,
        publishedAt: notice.publishedAt ? new Date(notice.publishedAt) : null,
        expiresAt: notice.expiresAt ? new Date(notice.expiresAt) : null,
      },
    });
  }

  for (const loc of bundle.massLocations) {
    const existing = await prisma.massLocation.findFirst({ where: { name: loc.name } });
    const data = {
      name: loc.name,
      address: loc.address,
      scheduleText: loc.scheduleText,
      sortOrder: loc.sortOrder,
      published: loc.published,
    };
    if (existing) {
      await prisma.massLocation.update({ where: { id: existing.id }, data });
    } else {
      await prisma.massLocation.create({ data: { ...data, id: loc.id } });
    }
  }

  for (const slot of bundle.tercoOnlineSlots) {
    await prisma.tercoOnlineSlot.upsert({
      where: { id: slot.id },
      update: {
        title: slot.title,
        scheduleText: slot.scheduleText,
        meetingUrl: slot.meetingUrl,
        sortOrder: slot.sortOrder,
      },
      create: {
        id: slot.id,
        title: slot.title,
        scheduleText: slot.scheduleText,
        meetingUrl: slot.meetingUrl,
        sortOrder: slot.sortOrder,
      },
    });
  }

  await prisma.homeQuickLink.deleteMany();
  for (const link of bundle.homeQuickLinks) {
    await prisma.homeQuickLink.create({
      data: {
        id: link.id,
        title: link.title,
        description: link.description,
        href: link.href,
        imageUrl: link.imageUrl,
        sortOrder: link.sortOrder,
        published: link.published,
        external: link.external,
      },
    });
  }

  await prisma.homeHeroCta.deleteMany();
  for (const cta of bundle.homeHeroCtas) {
    await prisma.homeHeroCta.create({
      data: {
        id: cta.id,
        label: cta.label,
        href: cta.href,
        sortOrder: cta.sortOrder,
        variant: cta.variant,
      },
    });
  }

  for (const candle of bundle.virtualCandles) {
    await prisma.virtualCandle.upsert({
      where: { id: candle.id },
      update: {
        donorName: candle.donorName,
        intention: candle.intention,
        prayer: candle.prayer,
        intentionPublic: candle.intentionPublic,
        prayerPublic: candle.prayerPublic,
        email: candle.email,
        parishNotifiedAt: candle.parishNotifiedAt ? new Date(candle.parishNotifiedAt) : null,
        amountCents: candle.amountCents,
        status: candle.status,
        paymentMethod: candle.paymentMethod,
        mercadoPagoId: candle.mercadoPagoId,
        preferenceId: candle.preferenceId,
        litAt: candle.litAt ? new Date(candle.litAt) : null,
        expiresAt: candle.expiresAt ? new Date(candle.expiresAt) : null,
        createdAt: new Date(candle.createdAt),
      },
      create: {
        id: candle.id,
        donorName: candle.donorName,
        intention: candle.intention,
        prayer: candle.prayer,
        intentionPublic: candle.intentionPublic,
        prayerPublic: candle.prayerPublic,
        email: candle.email,
        parishNotifiedAt: candle.parishNotifiedAt ? new Date(candle.parishNotifiedAt) : null,
        amountCents: candle.amountCents,
        status: candle.status,
        paymentMethod: candle.paymentMethod,
        mercadoPagoId: candle.mercadoPagoId,
        preferenceId: candle.preferenceId,
        litAt: candle.litAt ? new Date(candle.litAt) : null,
        expiresAt: candle.expiresAt ? new Date(candle.expiresAt) : null,
        createdAt: new Date(candle.createdAt),
      },
    });
  }

  for (const raffle of bundle.raffles) {
    await prisma.raffle.upsert({
      where: { id: raffle.id },
      update: {
        slug: raffle.slug,
        title: raffle.title,
        description: raffle.description,
        purpose: raffle.purpose,
        coverImageUrl: raffle.coverImageUrl,
        prizeTitle: raffle.prizeTitle,
        prizeDescription: raffle.prizeDescription,
        prizeImageUrl: raffle.prizeImageUrl,
        ticketPriceCents: raffle.ticketPriceCents,
        totalTickets: raffle.totalTickets,
        status: raffle.status,
        featuredOnHome: raffle.featuredOnHome,
        startsAt: raffle.startsAt ? new Date(raffle.startsAt) : null,
        endsAt: raffle.endsAt ? new Date(raffle.endsAt) : null,
        drawScheduledAt: raffle.drawScheduledAt ? new Date(raffle.drawScheduledAt) : null,
        reservationMinutes: raffle.reservationMinutes,
        drawWinningNumber: raffle.drawWinningNumber,
        drawWinnerName: raffle.drawWinnerName,
        drawWinnerContact: raffle.drawWinnerContact,
        drawNotes: raffle.drawNotes,
        drawRecordedAt: raffle.drawRecordedAt ? new Date(raffle.drawRecordedAt) : null,
      },
      create: {
        id: raffle.id,
        slug: raffle.slug,
        title: raffle.title,
        description: raffle.description,
        purpose: raffle.purpose,
        coverImageUrl: raffle.coverImageUrl,
        prizeTitle: raffle.prizeTitle,
        prizeDescription: raffle.prizeDescription,
        prizeImageUrl: raffle.prizeImageUrl,
        ticketPriceCents: raffle.ticketPriceCents,
        totalTickets: raffle.totalTickets,
        status: raffle.status,
        featuredOnHome: raffle.featuredOnHome,
        startsAt: raffle.startsAt ? new Date(raffle.startsAt) : null,
        endsAt: raffle.endsAt ? new Date(raffle.endsAt) : null,
        drawScheduledAt: raffle.drawScheduledAt ? new Date(raffle.drawScheduledAt) : null,
        reservationMinutes: raffle.reservationMinutes,
        drawWinningNumber: raffle.drawWinningNumber,
        drawWinnerName: raffle.drawWinnerName,
        drawWinnerContact: raffle.drawWinnerContact,
        drawNotes: raffle.drawNotes,
        drawRecordedAt: raffle.drawRecordedAt ? new Date(raffle.drawRecordedAt) : null,
      },
    });
  }

  for (const ticket of bundle.raffleTickets) {
    await prisma.raffleTicket.upsert({
      where: { id: ticket.id },
      update: {
        raffleId: ticket.raffleId,
        saintId: ticket.saintId,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        reservationExpiresAt: ticket.reservationExpiresAt
          ? new Date(ticket.reservationExpiresAt)
          : null,
        reservedSessionId: ticket.reservedSessionId,
        soldAt: ticket.soldAt ? new Date(ticket.soldAt) : null,
      },
      create: {
        id: ticket.id,
        raffleId: ticket.raffleId,
        saintId: ticket.saintId,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        reservationExpiresAt: ticket.reservationExpiresAt
          ? new Date(ticket.reservationExpiresAt)
          : null,
        reservedSessionId: ticket.reservedSessionId,
        soldAt: ticket.soldAt ? new Date(ticket.soldAt) : null,
      },
    });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { SbRollyRepository } from "@/infrastructure/repositories/SbRollyRepository";
import { DfCreateRollyUsecase } from "@/application/usecases/rolly/DfCreateRollyUsecase";
import { CreateRollyDto } from "@/application/usecases/rolly/dto/CreateRollyDto";
import { DfCreatedRollyUsecase } from "@/application/usecases/rolly/DfCreatedRollyUsecase";
import { CreatedRollyDto } from "@/application/usecases/rolly/dto/CreatedRollyDto";
import { UUID } from "@/types/common";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const newRolly: CreateRollyDto = {
      userId: body.userId,
      typeId: body.typeId,
      title: body.title,
      image: body.image,
      phrase: body.phrase,
      backgroundThemeId: body.backgroundThemeId,
    };

    const repository = new SbRollyRepository();
    const createRollyUseCase = new DfCreateRollyUsecase(repository);
    const rollyId = await createRollyUseCase.execute(newRolly);

    if (!rollyId) {
      return NextResponse.json({ error: "Rolly 생성 실패" }, { status: 500 });
    }

    return NextResponse.json({ success: true, rollyId }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId"); // 쿼리에서 userId 가져오기

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const createdRollyRepository = new SbRollyRepository();
    const createdRollyUsecase = new DfCreatedRollyUsecase(
      createdRollyRepository
    );
    const createdRollyDto: CreatedRollyDto[] =
      await createdRollyUsecase.execute(userId as UUID);

    return NextResponse.json(createdRollyDto);
  } catch (error) {
    console.error("Error fetching created Rolly:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
